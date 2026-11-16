import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading, M3Spinner } from '@/components/ui/loading';
import { Sheet } from '@/components/ui/sheet';
import { Banner, Field, Group, ListRow, ToggleRow } from '@/components/ui/kit';
import { M3Switch } from '@/components/ui/m3-motion';
import { SyntaxEditor } from '@/components/worker-ide/SyntaxEditor';
import { FileTreeDrawer } from '@/components/worker-ide/FileTreeDrawer';
import { useTheme } from '@/hooks/use-theme';
import { getBackdropBlurStyle, getGlassStyle } from '@/components/ui/glass';
import { useAuth } from '@/contexts/auth';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import * as api from '@/services/cloudflare';
import {
  getMimeLabel,
  getModuleBadge,
  getStarterFileContent,
  isBinaryModule,
  isEntryPointCandidate,
  normalizeModulePath,
  resolveWorkerModuleMime,
  WorkerIdeFile,
} from '@/services/worker-ide';

type DeployStatus = 'idle' | 'deploying' | 'synced' | 'error';

const detectModuleSyntax = (c: string) =>
  /\bexport\s+(default|\{|async|function|const|let|var|class)/.test(c) ||
  !/addEventListener\s*\(\s*['"](fetch|scheduled)['"]/.test(c);

function pickDefaultMainModule(paths: string[], entryHint?: string): string {
  if (entryHint && paths.includes(entryHint)) return entryHint;
  const preferred = paths.find((p) => /(^|\/)index\.(m?js|ts|py)$/i.test(p));
  if (preferred) return preferred;
  const candidate = paths.find((p) => isEntryPointCandidate(p));
  return candidate ?? paths[0] ?? 'index.js';
}

export default function WorkerIdeScreen() {
  const { script } = useLocalSearchParams<{ script: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { accountId } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, WorkerIdeFile>>({});
  const [folders, setFolders] = useState<string[]>([]);
  const [mainModule, setMainModule] = useState<string>('index.js');
  const [moduleSyntax, setModuleSyntax] = useState<boolean>(true);

  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(isWide);

  const [autoDeploy, setAutoDeploy] = useState<boolean>(false);
  const [deployStatus, setDeployStatus] = useState<DeployStatus>('idle');
  const [deployError, setDeployError] = useState<string | null>(null);

  // Incremented only by user edits/mutations to drive debounced auto-deploy
  const [mutationTick, setMutationTick] = useState(0);

  // Per-file undo stack (latest previous snapshots)
  const undoMapRef = useRef<Record<string, string[]>>({});
  const [undoTick, setUndoTick] = useState(0);

  // Modals / sheets
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [useStarterCode, setUseStarterCode] = useState(true);

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState('');

  const [menuFilePath, setMenuFilePath] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const extractErr = (e: any) =>
    e?.response?.data?.errors?.[0]?.message ?? e?.message ?? 'Error';

  const loadWorkspace = useCallback(async () => {
    if (!accountId || !script) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [contentRes, settingsRes] = await Promise.allSettled([
        api.getWorkerContent(accountId, script),
        api.getWorkerSettings(accountId, script),
      ]);

      if (contentRes.status === 'rejected') {
        throw contentRes.reason;
      }

      const raw = contentRes.value;
      const { modules, multipart } = api.parseWorkerModules(raw);
      const settingsData =
        settingsRes.status === 'fulfilled' ? (settingsRes.value.result as any) : null;
      const entryHint: string | undefined = settingsData?.entry_point;

      const parsedFiles: Record<string, WorkerIdeFile> = {};
      const allPaths: string[] = [];

      const firstSingleContent = modules[0]?.content ?? raw;
      const inferredES = multipart || detectModuleSyntax(firstSingleContent);
      setModuleSyntax(inferredES);

      modules.forEach((m, idx) => {
        const fallbackName = idx === 0 ? 'worker.js' : `module-${idx}.js`;
        const cleanPath = normalizeModulePath(m.name || fallbackName) || fallbackName;
        const binary = isBinaryModule(cleanPath, m.contentType);
        const ct = resolveWorkerModuleMime(cleanPath, inferredES, m.contentType);
        parsedFiles[cleanPath] = {
          path: cleanPath,
          content: binary ? '' : m.content,
          contentType: ct,
          isBinary: binary,
          sizeBytes: m.content.length,
          dirty: false,
        };
        allPaths.push(cleanPath);
      });

      const entry = pickDefaultMainModule(allPaths, entryHint);
      setFiles(parsedFiles);
      setFolders([]);
      setMainModule(entry);
      setOpenTabs(entry ? [entry] : []);
      setActivePath(entry || null);
      undoMapRef.current = {};
      setDeployStatus('idle');
      setDeployError(null);
    } catch (e: any) {
      setLoadError(extractErr(e));
    } finally {
      setLoading(false);
    }
  }, [accountId, script]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const dirtyCount = useMemo(
    () => Object.values(files).filter((f) => f.dirty).length,
    [files]
  );

  const deployWorkspace = useCallback(async () => {
    if (!accountId || !script) return;
    const allFiles = Object.values(files);
    if (allFiles.length === 0) return;

    const entry = files[mainModule]
      ? mainModule
      : pickDefaultMainModule(Object.keys(files));

    setDeployStatus('deploying');
    setDeployError(null);
    try {
      await api.updateWorkerModules(accountId, script, {
        modules: allFiles.map((f) => ({
          name: f.path,
          content: f.isBinary ? undefined : f.content,
          fileUri: f.fileUri,
          contentType: f.contentType,
        })),
        mainModule: entry,
        moduleSyntax: allFiles.length > 1 ? true : moduleSyntax,
      });
      setMainModule(entry);
      setFiles((prev) => {
        const next: Record<string, WorkerIdeFile> = {};
        for (const [k, v] of Object.entries(prev)) {
          next[k] = { ...v, dirty: false };
        }
        return next;
      });
      setDeployStatus('synced');
    } catch (e: any) {
      setDeployStatus('error');
      setDeployError(extractErr(e));
    }
  }, [accountId, script, files, mainModule, moduleSyntax]);

  // Debounced auto-deploy whenever autoDeploy is enabled and user mutates workspace
  useEffect(() => {
    if (!autoDeploy || mutationTick === 0 || loading) return;
    const timer = setTimeout(() => {
      deployWorkspace();
    }, 1400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDeploy, mutationTick]);

  const bumpMutation = () => {
    setMutationTick((n) => n + 1);
    setDeployStatus((s) => (s === 'synced' ? 'idle' : s));
  };

  const openFile = (path: string) => {
    setOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]));
    setActivePath(path);
    if (!isWide) setDrawerOpen(false);
  };

  const closeTab = (path: string) => {
    setOpenTabs((prev) => {
      const next = prev.filter((p) => p !== path);
      if (activePath === path) {
        const idx = prev.indexOf(path);
        const fallback = next[idx] ?? next[idx - 1] ?? next[0] ?? null;
        setActivePath(fallback);
      }
      return next;
    });
  };

  const handleCodeChange = (nextText: string) => {
    if (!activePath) return;
    const current = files[activePath];
    if (!current || current.content === nextText) return;

    const stack = undoMapRef.current[activePath] ?? [];
    if (stack[stack.length - 1] !== current.content) {
      undoMapRef.current[activePath] = [...stack.slice(-24), current.content];
      setUndoTick((n) => n + 1);
    }

    setFiles((prev) => {
      const target = prev[activePath];
      if (!target) return prev;
      return {
        ...prev,
        [activePath]: {
          ...target,
          content: nextText,
          sizeBytes: nextText.length,
          dirty: true,
        },
      };
    });
    bumpMutation();
  };

  const handleUndo = () => {
    if (!activePath) return;
    const stack = undoMapRef.current[activePath];
    if (!stack || stack.length === 0) return;
    const prevContent = stack.pop()!;
    setUndoTick((n) => n + 1);
    setFiles((prev) => {
      const target = prev[activePath];
      if (!target) return prev;
      return {
        ...prev,
        [activePath]: {
          ...target,
          content: prevContent,
          sizeBytes: prevContent.length,
          dirty: true,
        },
      };
    });
    bumpMutation();
  };

  const handleCreateFile = () => {
    const clean = normalizeModulePath(newFilePath);
    if (!clean) return;
    if (files[clean]) {
      openFile(clean);
      setShowNewFile(false);
      setNewFilePath('');
      return;
    }
    const binary = isBinaryModule(clean);
    const starter = !binary && useStarterCode ? getStarterFileContent(clean) : '';
    const ct = resolveWorkerModuleMime(clean, true);
    const created: WorkerIdeFile = {
      path: clean,
      content: starter,
      contentType: ct,
      isBinary: binary,
      sizeBytes: starter.length,
      dirty: true,
    };
    setFiles((prev) => ({ ...prev, [clean]: created }));
    setShowNewFile(false);
    setNewFilePath('');
    openFile(clean);
    bumpMutation();
  };

  const handleCreateFolder = () => {
    const clean = normalizeModulePath(newFolderPath);
    if (!clean) return;
    setFolders((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
    setSelectedFolder(clean);
    setShowNewFolder(false);
    setNewFolderPath('');
  };

  const handleUploadFiles = async (inFolder?: string) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) return;

      const prefix = inFolder ? `${normalizeModulePath(inFolder)}/` : '';
      const imported: Record<string, WorkerIdeFile> = {};
      const importedPaths: string[] = [];

      for (const asset of res.assets) {
        const cleanName = normalizeModulePath(`${prefix}${asset.name}`);
        if (!cleanName) continue;
        const binary = isBinaryModule(cleanName, asset.mimeType);
        const ct = resolveWorkerModuleMime(cleanName, true, asset.mimeType);

        if (binary) {
          imported[cleanName] = {
            path: cleanName,
            content: '',
            contentType: ct,
            isBinary: true,
            fileUri: asset.uri,
            sizeBytes: asset.size,
            dirty: true,
          };
        } else {
          let text = '';
          if (Platform.OS === 'web') {
            if ((asset as any).file && typeof (asset as any).file.text === 'function') {
              text = await (asset as any).file.text();
            } else {
              const resp = await fetch(asset.uri);
              text = await resp.text();
            }
          } else {
            text = await FileSystem.readAsStringAsync(asset.uri);
          }
          imported[cleanName] = {
            path: cleanName,
            content: text,
            contentType: ct,
            isBinary: false,
            sizeBytes: text.length,
            dirty: true,
          };
        }
        importedPaths.push(cleanName);
      }

      if (importedPaths.length === 0) return;

      setFiles((prev) => ({ ...prev, ...imported }));
      setOpenTabs((prev) => {
        const next = [...prev];
        for (const p of importedPaths) {
          if (!next.includes(p)) next.push(p);
        }
        return next;
      });
      setActivePath(importedPaths[0]);
      if (!isWide) setDrawerOpen(false);
      bumpMutation();
    } catch (e: any) {
      setDeployError(extractErr(e));
    }
  };

  const replaceBinaryFile = async (targetPath: string) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      setFiles((prev) => {
        const existing = prev[targetPath];
        if (!existing) return prev;
        return {
          ...prev,
          [targetPath]: {
            ...existing,
            fileUri: asset.uri,
            sizeBytes: asset.size,
            dirty: true,
          },
        };
      });
      bumpMutation();
    } catch (e: any) {
      setDeployError(extractErr(e));
    }
  };

  const handleRenameSubmit = () => {
    if (!renameTarget) return;
    const clean = normalizeModulePath(renameValue);
    if (!clean || clean === renameTarget || files[clean]) {
      setRenameTarget(null);
      return;
    }
    setFiles((prev) => {
      const old = prev[renameTarget];
      if (!old) return prev;
      const next = { ...prev };
      delete next[renameTarget];
      const binary = isBinaryModule(clean, old.contentType);
      next[clean] = {
        ...old,
        path: clean,
        isBinary: binary,
        contentType: resolveWorkerModuleMime(clean, moduleSyntax),
        dirty: true,
      };
      return next;
    });
    setOpenTabs((prev) => prev.map((p) => (p === renameTarget ? clean : p)));
    if (activePath === renameTarget) setActivePath(clean);
    if (mainModule === renameTarget) setMainModule(clean);
    setRenameTarget(null);
    bumpMutation();
  };

  const handleDuplicateFile = (path: string) => {
    const src = files[path];
    if (!src || src.isBinary) return;
    const dotIdx = path.lastIndexOf('.');
    const base = dotIdx > 0 ? path.slice(0, dotIdx) : path;
    const ext = dotIdx > 0 ? path.slice(dotIdx) : '';
    let copyPath = `${base}.copy${ext}`;
    let counter = 2;
    while (files[copyPath]) {
      copyPath = `${base}.copy${counter}${ext}`;
      counter++;
    }
    setFiles((prev) => ({
      ...prev,
      [copyPath]: { ...src, path: copyPath, dirty: true },
    }));
    openFile(copyPath);
    bumpMutation();
  };

  const confirmDeleteFile = (path: string) => {
    const remainingKeys = Object.keys(files).filter((k) => k !== path);
    if (remainingKeys.length === 0) return;
    setFiles((prev) => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
    closeTab(path);
    if (mainModule === path) {
      setMainModule(pickDefaultMainModule(remainingKeys));
    }
    setDeleteTarget(null);
    bumpMutation();
  };

  const handleBack = () => {
    if (dirtyCount > 0 && !autoDeploy) {
      setShowLeaveConfirm(true);
      return;
    }
    router.back();
  };

  const activeFile = activePath ? files[activePath] ?? null : null;
  const canUndo = !!(activePath && (undoMapRef.current[activePath]?.length ?? 0) > 0 && undoTick >= 0);
  const totalFiles = Object.keys(files).length;

  const statusText =
    deployStatus === 'deploying'
      ? t('worker_ide.status_deploying')
      : deployStatus === 'synced'
        ? t('worker_ide.status_synced')
        : deployStatus === 'error'
          ? t('worker_ide.status_error')
          : dirtyCount > 0
            ? t('worker_ide.status_unsaved', { count: dirtyCount })
            : t('worker_ide.status_ready');

  const statusColor =
    deployStatus === 'synced'
      ? colors.success
      : deployStatus === 'error'
        ? colors.error
        : deployStatus === 'deploying' || dirtyCount > 0
          ? colors.primary
          : colors.textTertiary;

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <Loading />
        </View>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={[
            styles.screen,
            styles.errorWrap,
            { backgroundColor: colors.background, paddingTop: insets.top + Spacing.lg },
          ]}
        >
          <Banner message={loadError} />
          <View style={styles.errorActions}>
            <Button title={t('common.back')} variant="secondary" onPress={() => router.back()} />
            <Button title={t('common.retry')} onPress={loadWorkspace} />
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={[
          styles.screen,
          { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top IDE Header Bar */}
        <View style={[styles.topBar, getGlassStyle(colors, isDark, 'header'), { borderBottomColor: colors.glassBorderSubtle }]}>
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={8}
            style={styles.iconAction}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Icon name="arrow-left" size={20} color={colors.onSurface} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDrawerOpen((v) => !v)}
            hitSlop={8}
            style={[
              styles.iconAction,
              drawerOpen && { backgroundColor: colors.secondaryContainer },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('worker_ide.toggle_files')}
          >
            <Icon name="sidebar" size={19} color={drawerOpen ? colors.onSecondaryContainer : colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.statusWrap}>
            {deployStatus === 'deploying' ? (
              <M3Spinner size="sm" color={colors.primary} />
            ) : (
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            )}
            <Text style={[styles.statusLabel, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {statusText}
            </Text>
          </View>

          <View style={styles.autoToggle}>
            <Text style={[styles.autoLabel, { color: colors.onSurfaceVariant }]}>
              {t('worker_ide.auto_deploy')}
            </Text>
            <M3Switch
              value={autoDeploy}
              onValueChange={setAutoDeploy}
            />
          </View>

          <Button
            title={
              dirtyCount > 0
                ? `${t('worker.deploy')} (${dirtyCount})`
                : t('worker.deploy')
            }
            size="sm"
            loading={deployStatus === 'deploying'}
            disabled={deployStatus === 'deploying' || totalFiles === 0}
            onPress={deployWorkspace}
          />
        </View>

        {deployError && (
          <View style={styles.errorBannerWrap}>
            <Banner message={deployError} />
          </View>
        )}

        {/* Open File Tabs Strip */}
        <View style={[styles.tabsBar, { backgroundColor: colors.glassSurfaceSubtle, borderBottomColor: colors.glassBorderSubtle }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}
          >
            {openTabs.map((tabPath) => {
              const tabFile = files[tabPath];
              if (!tabFile) return null;
              const isActive = tabPath === activePath;
              const fileName = tabPath.split('/').pop() ?? tabPath;
              return (
                <View
                  key={tabPath}
                  style={[
                    styles.tabItem,
                    {
                      backgroundColor: isActive ? colors.glassSurfaceElevated : 'transparent',
                      borderBottomColor: isActive ? colors.primary : 'transparent',
                      borderRightColor: colors.glassBorderSubtle,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.tabPress}
                    onPress={() => setActivePath(tabPath)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.tabExt,
                        { color: isActive ? colors.primary : colors.textTertiary },
                      ]}
                    >
                      {getModuleBadge(tabPath)}
                    </Text>
                    <Text
                      style={[
                        styles.tabName,
                        { color: isActive ? colors.text : colors.textSecondary },
                        isActive && { fontWeight: '600' },
                      ]}
                      numberOfLines={1}
                    >
                      {fileName}
                    </Text>
                    {tabFile.dirty && (
                      <View style={[styles.tabDirtyDot, { backgroundColor: colors.primary }]} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => closeTab(tabPath)}
                    hitSlop={6}
                    style={styles.tabClose}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.close')}
                  >
                    <Icon name="close" size={12} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Breadcrumb + Quick Actions Bar */}
        {activeFile && (
          <View
            style={[
              styles.breadcrumbBar,
              { backgroundColor: colors.glassSurface, borderBottomColor: colors.glassBorderSubtle },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.breadcrumbScroll}
            >
              <Text style={[styles.breadcrumbText, { color: colors.textTertiary }]}>
                {script}
              </Text>
              {activeFile.path.split('/').map((seg, idx, arr) => (
                <React.Fragment key={`${seg}-${idx}`}>
                  <Text style={[styles.breadcrumbSep, { color: colors.textTertiary }]}>›</Text>
                  <Text
                    style={[
                      styles.breadcrumbText,
                      {
                        color: idx === arr.length - 1 ? colors.text : colors.textSecondary,
                        fontWeight: idx === arr.length - 1 ? '600' : '400',
                      },
                    ]}
                  >
                    {seg}
                  </Text>
                </React.Fragment>
              ))}
            </ScrollView>

            <View style={styles.breadcrumbActions}>
              <View style={[styles.mimeBadge, getGlassStyle(colors, isDark, 'subtle', Radius.full)]}>
                <Text style={[styles.mimeText, { color: colors.textSecondary }]}>
                  {getMimeLabel(activeFile.contentType)}
                </Text>
              </View>
              {activeFile.path === mainModule ? (
                <View style={[styles.entryBadge, { backgroundColor: colors.primary + '1A' }]}>
                  <Text style={[styles.entryBadgeText, { color: colors.primary }]}>
                    {t('worker_ide.entry_point')}
                  </Text>
                </View>
              ) : isEntryPointCandidate(activeFile.path) ? (
                <TouchableOpacity
                  onPress={() => {
                    setMainModule(activeFile.path);
                    bumpMutation();
                  }}
                  style={[styles.miniBtn, getGlassStyle(colors, isDark, 'subtle', Radius.full)]}
                >
                  <Text style={[styles.miniBtnText, { color: colors.textSecondary }]}>
                    {t('worker_ide.set_entry')}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {!activeFile.isBinary && (
                <>
                  <TouchableOpacity
                    onPress={handleUndo}
                    disabled={!canUndo}
                    style={[styles.miniIconBtn, { opacity: canUndo ? 1 : 0.35 }]}
                    accessibilityRole="button"
                    accessibilityLabel={t('worker_ide.undo')}
                  >
                    <Icon name="undo" size={15} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => Clipboard.setStringAsync(activeFile.content)}
                    style={styles.miniIconBtn}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.copy')}
                  >
                    <Icon name="copy" size={15} color={colors.text} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}

        {/* Workspace Body: Left Drawer + Active Editor */}
        <View style={styles.workspaceBody}>
          {isWide && drawerOpen && (
            <View style={styles.wideDrawerSlot}>
              <FileTreeDrawer
                scriptName={script}
                files={files}
                folders={folders}
                activePath={activePath}
                mainModule={mainModule}
                selectedFolder={selectedFolder}
                onSelectFolder={setSelectedFolder}
                onSelectFile={openFile}
                onNewFile={(folder) => {
                  setNewFilePath(folder ? `${folder}/` : '');
                  setShowNewFile(true);
                }}
                onNewFolder={(folder) => {
                  setNewFolderPath(folder ? `${folder}/` : '');
                  setShowNewFolder(true);
                }}
                onUploadFiles={handleUploadFiles}
                onFileMenu={(p) => setMenuFilePath(p)}
              />
            </View>
          )}

          {/* Editor Surface */}
          <View style={styles.editorArea}>
            {!activeFile ? (
              <View style={styles.emptyCenter}>
                <Icon name="file-code" size={34} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {t('worker_ide.no_file_open')}
                </Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  {t('worker_ide.no_file_open_hint')}
                </Text>
                <View style={styles.emptyBtns}>
                  <Button
                    title={t('worker_ide.browse_files')}
                    variant="secondary"
                    size="sm"
                    onPress={() => setDrawerOpen(true)}
                  />
                  <Button
                    title={t('worker_ide.new_file')}
                    size="sm"
                    onPress={() => {
                      setNewFilePath('');
                      setShowNewFile(true);
                    }}
                  />
                </View>
              </View>
            ) : activeFile.isBinary ? (
              <View style={styles.binaryWrap}>
                <Card style={styles.binaryCard}>
                  <Icon name="file" size={32} color={colors.primary} />
                  <Text style={[styles.binaryName, { color: colors.text }]}>{activeFile.path}</Text>
                  <Text style={[styles.binaryMeta, { color: colors.textSecondary }]}>
                    {getMimeLabel(activeFile.contentType)}
                    {activeFile.sizeBytes != null ? ` · ${activeFile.sizeBytes} bytes` : ''}
                  </Text>
                  <Text style={[styles.binaryHint, { color: colors.textTertiary }]}>
                    {t('worker_ide.binary_hint')}
                  </Text>
                  <View style={styles.binaryActions}>
                    <Button
                      title={t('worker_ide.replace_file')}
                      variant="secondary"
                      size="sm"
                      icon={<Icon name="cloud-upload" size={14} color={colors.text} />}
                      onPress={() => replaceBinaryFile(activeFile.path)}
                    />
                    {totalFiles > 1 && (
                      <Button
                        title={t('common.delete')}
                        variant="danger"
                        size="sm"
                        onPress={() => setDeleteTarget(activeFile.path)}
                      />
                    )}
                  </View>
                </Card>
              </View>
            ) : (
              <SyntaxEditor
                value={activeFile.content}
                onChangeText={handleCodeChange}
                filename={activeFile.path}
                placeholder={t('worker_ide.editor_placeholder')}
              />
            )}
          </View>

          {/* Mobile Slide-Over Drawer */}
          {!isWide && drawerOpen && (
            <View style={styles.overlayRoot}>
              <TouchableOpacity
                style={[styles.overlayBackdrop, { backgroundColor: colors.glassOverlay }, getBackdropBlurStyle(8)]}
                activeOpacity={1}
                onPress={() => setDrawerOpen(false)}
              />
              <View style={[styles.overlayDrawer, { width: Math.min(300, width * 0.84) }]}>
                <FileTreeDrawer
                  scriptName={script}
                  files={files}
                  folders={folders}
                  activePath={activePath}
                  mainModule={mainModule}
                  selectedFolder={selectedFolder}
                  onSelectFolder={setSelectedFolder}
                  onSelectFile={openFile}
                  onNewFile={(folder) => {
                    setNewFilePath(folder ? `${folder}/` : '');
                    setShowNewFile(true);
                  }}
                  onNewFolder={(folder) => {
                    setNewFolderPath(folder ? `${folder}/` : '');
                    setShowNewFolder(true);
                  }}
                  onUploadFiles={handleUploadFiles}
                  onFileMenu={(p) => setMenuFilePath(p)}
                  onClose={() => setDrawerOpen(false)}
                  showClose
                />
              </View>
            </View>
          )}
        </View>

        {/* New File Sheet */}
        <Sheet
          visible={showNewFile}
          onClose={() => setShowNewFile(false)}
          title={t('worker_ide.new_file')}
          footer={
            <Button
              title={t('common.create')}
              onPress={handleCreateFile}
              disabled={!normalizeModulePath(newFilePath)}
            />
          }
        >
          <Field
            label={t('worker_ide.file_path')}
            placeholder="src/routes/api.js"
            value={newFilePath}
            onChangeText={setNewFilePath}
            autoCapitalize="none"
            autoCorrect={false}
            mono
            hint={
              normalizeModulePath(newFilePath)
                ? `${t('worker_ide.detected_type')}: ${getMimeLabel(resolveWorkerModuleMime(normalizeModulePath(newFilePath), true))}`
                : t('worker_ide.file_path_hint')
            }
          />
          <Group style={{ marginTop: Spacing.lg }}>
            <ToggleRow
              title={t('worker_ide.starter_snippet')}
              subtitle={t('worker_ide.starter_snippet_hint')}
              value={useStarterCode}
              onValueChange={setUseStarterCode}
            />
          </Group>
        </Sheet>

        {/* New Folder Sheet */}
        <Sheet
          visible={showNewFolder}
          onClose={() => setShowNewFolder(false)}
          title={t('worker_ide.new_folder')}
          footer={
            <Button
              title={t('common.create')}
              onPress={handleCreateFolder}
              disabled={!normalizeModulePath(newFolderPath)}
            />
          }
        >
          <Field
            label={t('worker_ide.folder_path')}
            placeholder="src/utils"
            value={newFolderPath}
            onChangeText={setNewFolderPath}
            autoCapitalize="none"
            autoCorrect={false}
            mono
          />
        </Sheet>

        {/* File Actions Sheet */}
        <Sheet
          visible={!!menuFilePath}
          onClose={() => setMenuFilePath(null)}
          title={menuFilePath ?? ''}
        >
          {menuFilePath && (
            <Group>
              {isEntryPointCandidate(menuFilePath) && mainModule !== menuFilePath && (
                <ListRow
                  icon="star"
                  title={t('worker_ide.set_entry')}
                  onPress={() => {
                    setMainModule(menuFilePath);
                    setMenuFilePath(null);
                    bumpMutation();
                  }}
                />
              )}
              <ListRow
                icon="edit"
                title={t('worker_ide.rename_file')}
                onPress={() => {
                  setRenameTarget(menuFilePath);
                  setRenameValue(menuFilePath);
                  setMenuFilePath(null);
                }}
              />
              {!files[menuFilePath]?.isBinary && (
                <ListRow
                  icon="copy"
                  title={t('worker_ide.duplicate_file')}
                  onPress={() => {
                    const p = menuFilePath;
                    setMenuFilePath(null);
                    handleDuplicateFile(p);
                  }}
                />
              )}
              {totalFiles > 1 && (
                <ListRow
                  icon="trash"
                  iconTone="error"
                  title={t('common.delete')}
                  onPress={() => {
                    const p = menuFilePath;
                    setMenuFilePath(null);
                    setDeleteTarget(p);
                  }}
                />
              )}
            </Group>
          )}
        </Sheet>

        {/* Rename File Sheet */}
        <Sheet
          visible={!!renameTarget}
          onClose={() => setRenameTarget(null)}
          title={t('worker_ide.rename_file')}
          footer={
            <Button
              title={t('common.save')}
              onPress={handleRenameSubmit}
              disabled={!normalizeModulePath(renameValue) || normalizeModulePath(renameValue) === renameTarget}
            />
          }
        >
          <Field
            label={t('worker_ide.file_path')}
            value={renameValue}
            onChangeText={setRenameValue}
            autoCapitalize="none"
            autoCorrect={false}
            mono
          />
        </Sheet>

        {/* Delete File Confirmation Sheet */}
        <Sheet
          visible={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={t('worker_ide.delete_file')}
          footer={
            <Button
              title={t('common.delete')}
              variant="danger"
              onPress={() => deleteTarget && confirmDeleteFile(deleteTarget)}
            />
          }
        >
          <Text style={[styles.confirmMsg, { color: colors.textSecondary }]}>
            {t('worker_ide.delete_file_confirm', { path: deleteTarget ?? '' })}
          </Text>
        </Sheet>

        {/* Unsaved Changes Leave Confirmation Sheet */}
        <Sheet
          visible={showLeaveConfirm}
          onClose={() => setShowLeaveConfirm(false)}
          title={t('worker_ide.unsaved_title')}
          footer={
            <View style={styles.leaveFooter}>
              <Button
                title={t('worker_ide.discard_and_exit')}
                variant="danger"
                onPress={() => {
                  setShowLeaveConfirm(false);
                  router.back();
                }}
              />
              <Button
                title={t('worker_ide.deploy_and_exit')}
                onPress={async () => {
                  setShowLeaveConfirm(false);
                  await deployWorkspace();
                  router.back();
                }}
              />
            </View>
          }
        >
          <Text style={[styles.confirmMsg, { color: colors.textSecondary }]}>
            {t('worker_ide.unsaved_message', { count: dirtyCount })}
          </Text>
        </Sheet>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  errorWrap: { padding: Spacing.lg, gap: Spacing.md },
  errorActions: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  autoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autoLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  errorBannerWrap: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  tabsBar: {
    borderBottomWidth: 1,
    minHeight: 38,
  },
  tabsScroll: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderRightWidth: 1,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    height: 38,
    maxWidth: 190,
  },
  tabPress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: '100%',
  },
  tabExt: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  tabName: {
    fontSize: FontSize.xs,
    maxWidth: 110,
  },
  tabDirtyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tabClose: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  breadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  breadcrumbScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  breadcrumbText: {
    fontSize: FontSize.xs,
    fontFamily: 'monospace',
  },
  breadcrumbSep: {
    fontSize: FontSize.xs,
  },
  breadcrumbActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mimeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  mimeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  entryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  entryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  miniBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  miniBtnText: {
    fontSize: 10,
    fontWeight: '500',
  },
  miniIconBtn: {
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspaceBody: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  wideDrawerSlot: {
    width: 265,
  },
  editorArea: {
    flex: 1,
  },
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 20,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  overlayDrawer: {
    height: '100%',
    zIndex: 21,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
  emptySub: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  emptyBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  binaryWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  binaryCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  binaryName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  binaryMeta: {
    fontSize: FontSize.sm,
  },
  binaryHint: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  binaryActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  confirmMsg: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  leaveFooter: {
    gap: Spacing.sm,
  },
});
