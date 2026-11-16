import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Banner, ChipRow, Field, FieldLabel, Group, ToggleRow } from '@/components/ui/kit';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import * as api from '@/services/cloudflare';
import {
  defaultCompatibilityDate,
  isValidWorkerName,
  WORKER_TEMPLATES,
  WorkerTemplate,
} from '@/services/worker-ide';

interface CreateWorkerSheetProps {
  visible: boolean;
  accountId: string;
  onClose: () => void;
  onCreated: (scriptName: string, openIde: boolean) => void;
}

export function CreateWorkerSheet({
  visible,
  accountId,
  onClose,
  onCreated,
}: CreateWorkerSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState<WorkerTemplate['id']>('router');
  const [compatDate, setCompatDate] = useState(defaultCompatibilityDate);
  const [enableSubdomain, setEnableSubdomain] = useState(true);
  const [openInIde, setOpenInIde] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => WORKER_TEMPLATES.find((tpl) => tpl.id === templateId) ?? WORKER_TEMPLATES[0],
    [templateId]
  );

  const cleanName = name.trim().toLowerCase();
  const nameValid = isValidWorkerName(cleanName);

  const resetAndClose = () => {
    if (deploying) return;
    setErrorMsg(null);
    onClose();
  };

  const handleCreate = async () => {
    if (!nameValid || deploying) return;
    setDeploying(true);
    setErrorMsg(null);
    try {
      await api.createWorkerScript(accountId, cleanName, {
        modules: selectedTemplate.files.map((f) => ({
          name: f.path,
          content: f.content,
          contentType: f.contentType,
        })),
        mainModule: selectedTemplate.mainModule,
        compatibilityDate: compatDate.trim() || defaultCompatibilityDate(),
        moduleSyntax: true,
      });

      if (enableSubdomain) {
        await api.setWorkerSubdomain(accountId, cleanName, true).catch(() => {});
      }

      const createdName = cleanName;
      const shouldOpenIde = openInIde;
      setName('');
      setErrorMsg(null);
      onCreated(createdName, shouldOpenIde);
    } catch (e: any) {
      const data = e?.response?.data;
      const rawString = typeof data === 'string' && data.trim() && !data.trim().startsWith('<')
        ? data.trim().slice(0, 240)
        : undefined;
      const msg =
        data?.errors?.[0]?.message ??
        data?.messages?.[0]?.message ??
        data?.error ??
        data?.message ??
        rawString ??
        e?.message ??
        t('worker_ide.create_failed');
      setErrorMsg(msg);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={resetAndClose}
      title={t('worker_ide.create_worker_title')}
      footer={
        <Button
          title={t('worker_ide.create_and_deploy')}
          onPress={handleCreate}
          loading={deploying}
          disabled={!nameValid}
          icon={<Icon name="cloud-upload" size={16} color="#FFFFFF" />}
        />
      }
    >
      {errorMsg && (
        <View style={{ marginBottom: Spacing.sm }}>
          <Banner message={errorMsg} />
        </View>
      )}

      <Field
        label={t('worker_ide.script_name')}
        placeholder="my-edge-worker"
        value={name}
        onChangeText={(val) => {
          setName(val.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
          if (errorMsg) setErrorMsg(null);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        mono
        hint={t('worker_ide.script_name_hint')}
      />

      <FieldLabel>{t('worker_ide.starter_template')}</FieldLabel>
      <View style={{ marginTop: Spacing.xs }}>
        <ChipRow
          wrap
          value={templateId}
          onChange={setTemplateId}
          options={WORKER_TEMPLATES.map((tpl) => ({
            value: tpl.id,
            label: t(tpl.labelKey),
          }))}
        />
      </View>

      <View
        style={[
          styles.tplPreview,
          { backgroundColor: colors.glassSurfaceSubtle, borderColor: colors.glassBorderSubtle },
        ]}
      >
        <Text style={[styles.tplDesc, { color: colors.onSurfaceVariant }]}>
          {t(selectedTemplate.descKey)}
        </Text>
        <View style={styles.fileChips}>
          {selectedTemplate.files.map((f) => (
            <View
              key={f.path}
              style={[
                styles.fileChip,
                { backgroundColor: colors.secondaryContainer, borderColor: 'transparent' },
              ]}
            >
              <Text style={[styles.fileChipText, { color: colors.onSecondaryContainer }]} numberOfLines={1}>
                {f.path}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Field
        label={t('worker.compatibility_date')}
        placeholder="2026-01-01"
        value={compatDate}
        onChangeText={setCompatDate}
        autoCapitalize="none"
        autoCorrect={false}
        mono
      />

      <Group style={{ marginTop: Spacing.lg }}>
        <ToggleRow
          title={t('worker.workers_dev')}
          subtitle={t('worker.workers_dev_hint')}
          value={enableSubdomain}
          onValueChange={setEnableSubdomain}
        />
        <ToggleRow
          title={t('worker_ide.open_ide_after_create')}
          subtitle={t('worker_ide.open_ide_after_create_hint')}
          value={openInIde}
          onValueChange={setOpenInIde}
        />
      </Group>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  tplPreview: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  tplDesc: {
    fontSize: FontSize.xs,
    lineHeight: 17,
  },
  fileChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  fileChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  fileChipText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
