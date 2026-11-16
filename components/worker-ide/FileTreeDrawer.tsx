import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { getGlassStyle } from '@/components/ui/glass';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import {
  buildFileTree,
  FileTreeNode,
  getModuleBadge,
  WorkerIdeFile,
} from '@/services/worker-ide';

interface FileTreeDrawerProps {
  scriptName: string;
  files: Record<string, WorkerIdeFile>;
  folders: string[];
  activePath: string | null;
  mainModule: string;
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
  onSelectFile: (path: string) => void;
  onNewFile: (inFolder?: string) => void;
  onNewFolder: (inFolder?: string) => void;
  onUploadFiles: (inFolder?: string) => void;
  onFileMenu: (path: string) => void;
  onClose?: () => void;
  showClose?: boolean;
}

export function FileTreeDrawer({
  scriptName,
  files,
  folders,
  activePath,
  mainModule,
  selectedFolder,
  onSelectFolder,
  onSelectFile,
  onNewFile,
  onNewFolder,
  onUploadFiles,
  onFileMenu,
  onClose,
  showClose = false,
}: FileTreeDrawerProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const filePaths = useMemo(() => Object.keys(files), [files]);

  const tree = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return buildFileTree(filePaths, folders);
    const matching = filePaths.filter((p) => p.toLowerCase().includes(q));
    return buildFileTree(matching, []);
  }, [filePaths, folders, filter]);

  const toggleFolder = (path: string) => {
    onSelectFolder(path);
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderNode = (node: FileTreeNode, depth: number): React.ReactNode => {
    const indent = Spacing.sm + depth * 14;

    if (node.kind === 'folder') {
      const isExpanded = filter.trim().length > 0 || !collapsed.has(node.path);
      const isTarget = selectedFolder === node.path;
      return (
        <View key={node.id}>
          <View
            style={[
              styles.nodeRow,
              { paddingLeft: indent },
              isTarget && { backgroundColor: colors.glassSurfaceSubtle },
            ]}
          >
            <TouchableOpacity
              style={styles.nodePress}
              onPress={() => toggleFolder(node.path)}
              activeOpacity={0.7}
            >
              <Icon
                name={isExpanded ? 'chevron-down' : 'chevron-right'}
                size={14}
                color={colors.textTertiary}
              />
              <Icon
                name={isExpanded ? 'folder-open' : 'folder'}
                size={16}
                color={colors.textSecondary}
              />
              <Text style={[styles.nodeName, { color: colors.text }]} numberOfLines={1}>
                {node.name}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onNewFile(node.path)}
              hitSlop={8}
              style={styles.rowAction}
              accessibilityRole="button"
              accessibilityLabel={t('worker_ide.new_file')}
            >
              <Icon name="plus" size={14} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
          {isExpanded && node.children?.map((child) => renderNode(child, depth + 1))}
        </View>
      );
    }

    const file = files[node.path];
    const isActive = activePath === node.path;
    const isEntry = mainModule === node.path;
    const badge = getModuleBadge(node.path);

    return (
      <View
        key={node.id}
        style={[
          styles.fileRowWrap,
          { paddingLeft: indent + 6 },
          isActive && [
            styles.activeFileRow,
            { backgroundColor: colors.secondaryContainer, borderColor: 'transparent' },
          ],
        ]}
      >
        <TouchableOpacity
          style={styles.nodePress}
          onPress={() => onSelectFile(node.path)}
          onLongPress={() => onFileMenu(node.path)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.extBadge,
              {
                backgroundColor: isActive ? colors.primaryContainer : colors.glassSurfaceSubtle,
                borderColor: 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.extBadgeText,
                { color: isActive ? colors.primary : colors.textSecondary },
              ]}
            >
              {badge}
            </Text>
          </View>
          <Text
            style={[
              styles.nodeName,
              { color: isActive ? colors.text : colors.textSecondary },
              isActive && { fontWeight: '600' },
            ]}
            numberOfLines={1}
          >
            {node.name}
          </Text>
          {isEntry && (
            <View style={[styles.entryPill, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[styles.entryText, { color: colors.primary }]}>
                {t('worker_ide.entry_short')}
              </Text>
            </View>
          )}
          {file?.dirty && (
            <View style={[styles.dirtyDot, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onFileMenu(node.path)}
          hitSlop={8}
          style={styles.rowAction}
          accessibilityRole="button"
          accessibilityLabel={t('worker_ide.file_actions')}
        >
          <Icon name="more-horizontal" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.drawer, getGlassStyle(colors, isDark, 'elevated'), { borderWidth: 0, borderRightWidth: 1, borderRightColor: colors.glassBorderSubtle }]}>
      {/* Top IDE Drawer Action Bar */}
      <View style={[styles.toolbar, { borderBottomColor: colors.glassBorderSubtle }]}>
        <TouchableOpacity
          onPress={() => {
            setSearchOpen((v) => !v);
            if (searchOpen) setFilter('');
          }}
          style={[styles.toolBtn, searchOpen && { backgroundColor: colors.glassSurfaceSubtle }]}
          accessibilityRole="button"
          accessibilityLabel={t('common.search')}
        >
          <Icon name="search" size={16} color={searchOpen ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onNewFile(selectedFolder || undefined)}
          style={styles.toolBtn}
          accessibilityRole="button"
          accessibilityLabel={t('worker_ide.new_file')}
        >
          <Icon name="file-code" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onNewFolder(selectedFolder || undefined)}
          style={styles.toolBtn}
          accessibilityRole="button"
          accessibilityLabel={t('worker_ide.new_folder')}
        >
          <Icon name="folder" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onUploadFiles(selectedFolder || undefined)}
          style={styles.toolBtn}
          accessibilityRole="button"
          accessibilityLabel={t('worker_ide.upload_files')}
        >
          <Icon name="cloud-upload" size={16} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {showClose && onClose && (
          <TouchableOpacity
            onPress={onClose}
            style={styles.toolBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Icon name="close" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Project root header */}
      <TouchableOpacity
        style={[styles.projectHeader, { borderBottomColor: colors.glassBorderSubtle }]}
        onPress={() => onSelectFolder('')}
        activeOpacity={0.75}
      >
        <Icon name="cf-workers" size={15} color={colors.primary} />
        <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>
          {scriptName}
        </Text>
        <Text style={[styles.fileCount, { color: colors.textTertiary }]}>
          {filePaths.length}
        </Text>
      </TouchableOpacity>

      {searchOpen && (
        <View style={[styles.filterBox, { borderBottomColor: colors.glassBorderSubtle }]}>
          <TextInput
            value={filter}
            onChangeText={setFilter}
            placeholder={t('worker_ide.filter_files')}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.filterInput,
              {
                color: colors.text,
                backgroundColor: colors.glassSurfaceSubtle,
                borderColor: colors.glassBorderSubtle,
              },
            ]}
          />
        </View>
      )}

      {/* File Tree */}
      <ScrollView
        style={styles.treeScroll}
        contentContainerStyle={styles.treeContent}
        showsVerticalScrollIndicator={false}
      >
        {tree.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            {t('worker_ide.no_matching_files')}
          </Text>
        ) : (
          tree.map((node) => renderNode(node, 0))
        )}
      </ScrollView>

      {/* Bottom quick-create footer */}
      <View style={[styles.drawerFooter, { borderTopColor: colors.glassBorderSubtle }]}>
        <TouchableOpacity
          style={[styles.footerBtn, getGlassStyle(colors, isDark, 'subtle', Radius.sm)]}
          onPress={() => onNewFile(selectedFolder || undefined)}
          activeOpacity={0.75}
        >
          <Icon name="plus" size={14} color={colors.text} />
          <Text style={[styles.footerBtnText, { color: colors.text }]}>
            {t('worker_ide.new_file')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerBtn, getGlassStyle(colors, isDark, 'subtle', Radius.sm)]}
          onPress={() => onUploadFiles(selectedFolder || undefined)}
          activeOpacity={0.75}
        >
          <Icon name="cloud-upload" size={14} color={colors.primary} />
          <Text style={[styles.footerBtnText, { color: colors.text }]}>
            {t('worker_ide.upload')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
    borderRightWidth: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  toolBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  projectName: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  fileCount: {
    fontSize: FontSize.xs,
    fontFamily: 'monospace',
  },
  filterBox: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  filterInput: {
    height: 32,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    fontSize: FontSize.xs,
  },
  treeScroll: {
    flex: 1,
  },
  treeContent: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    gap: 2,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 34,
    borderRadius: Radius.sm,
    paddingRight: Spacing.xs,
  },
  fileRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    borderRadius: Radius.md,
    paddingRight: Spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFileRow: {
    borderWidth: 1,
  },
  nodePress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 6,
  },
  nodeName: {
    flexShrink: 1,
    fontSize: FontSize.sm,
    fontWeight: '400',
  },
  extBadge: {
    minWidth: 30,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  entryPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  entryText: {
    fontSize: 9,
    fontWeight: '600',
  },
  dirtyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rowAction: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  drawerFooter: {
    flexDirection: 'row',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 34,
    borderRadius: Radius.md,
  },
  footerBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
});
