import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  LayoutChangeEvent,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Fonts, Spacing } from '@/constants/theme';
import { getFileExtension } from '@/services/worker-ide';

interface SyntaxEditorProps {
  value: string;
  onChangeText: (next: string) => void;
  filename: string;
  placeholder?: string;
  readOnly?: boolean;
}

type TokenKind = 'plain' | 'keyword' | 'string' | 'number' | 'comment' | 'tag' | 'property';

interface Token {
  kind: TokenKind;
  text: string;
}

const LINE_HEIGHT = 20;
const FONT_SIZE = 13;
const EDITOR_PAD_V = 12;
const EDITOR_PAD_H = 12;
const CHAR_WIDTH_ESTIMATE = 7.9;
const MAX_HIGHLIGHT_CHARS = 45000;

const JS_KEYWORDS = new Set([
  'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
  'default', 'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for',
  'from', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'null', 'of',
  'return', 'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof',
  'undefined', 'var', 'void', 'while', 'with', 'yield', 'interface', 'type', 'enum',
  'implements', 'private', 'public', 'protected', 'readonly', 'as', 'satisfies',
]);

const PY_KEYWORDS = new Set([
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del',
  'elif', 'else', 'except', 'False', 'finally', 'for', 'from', 'global', 'if', 'import',
  'in', 'is', 'lambda', 'None', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
  'True', 'try', 'while', 'with', 'yield',
]);

const SQL_KEYWORDS = new Set([
  'select', 'from', 'where', 'insert', 'into', 'values', 'update', 'set', 'delete',
  'create', 'table', 'alter', 'drop', 'join', 'left', 'right', 'inner', 'outer', 'on',
  'as', 'and', 'or', 'not', 'null', 'order', 'by', 'group', 'having', 'limit', 'offset',
  'distinct', 'union', 'all', 'primary', 'key', 'index', 'if', 'exists', 'integer', 'text',
]);

function tokenizeLineAware(code: string, ext: string): Token[] {
  const tokens: Token[] = [];
  const push = (kind: TokenKind, text: string) => {
    if (!text) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.kind === kind) {
      prev.text += text;
    } else {
      tokens.push({ kind, text });
    }
  };

  if (ext === 'json' || ext === 'jsonc') {
    const regex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*")(?=\s*:)|("(?:\\.|[^"\\])*")|\b(true|false|null)\b|\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(code)) !== null) {
      if (m.index > last) push('plain', code.slice(last, m.index));
      if (m[1]) push('comment', m[1]);
      else if (m[2]) push('property', m[2]);
      else if (m[3]) push('string', m[3]);
      else if (m[4]) push('keyword', m[4]);
      else if (m[5]) push('number', m[5]);
      last = regex.lastIndex;
    }
    if (last < code.length) push('plain', code.slice(last));
    return tokens;
  }

  if (ext === 'html' || ext === 'htm' || ext === 'xml' || ext === 'svg') {
    const regex = /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z0-9:-]+)|(\/?>)|([a-zA-Z0-9:-]+)(?==)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(code)) !== null) {
      if (m.index > last) push('plain', code.slice(last, m.index));
      if (m[1]) push('comment', m[1]);
      else if (m[2] || m[3]) push('tag', m[2] ?? m[3]);
      else if (m[4]) push('property', m[4]);
      else if (m[5]) push('string', m[5]);
      last = regex.lastIndex;
    }
    if (last < code.length) push('plain', code.slice(last));
    return tokens;
  }

  if (ext === 'css') {
    const regex = /(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|([a-zA-Z-]+)(?=\s*:)|(#[0-9a-fA-F]{3,8}|\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|ms|s)?\b)|(@[a-zA-Z-]+|\.[a-zA-Z_-][a-zA-Z0-9_-]*)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(code)) !== null) {
      if (m.index > last) push('plain', code.slice(last, m.index));
      if (m[1]) push('comment', m[1]);
      else if (m[2]) push('string', m[2]);
      else if (m[3]) push('property', m[3]);
      else if (m[4]) push('number', m[4]);
      else if (m[5]) push('keyword', m[5]);
      last = regex.lastIndex;
    }
    if (last < code.length) push('plain', code.slice(last));
    return tokens;
  }

  if (ext === 'py' || ext === 'toml' || ext === 'yaml' || ext === 'yml') {
    const regex = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b([A-Za-z_][A-Za-z0-9_]*)\b|\b(\d+(?:\.\d+)?)\b/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(code)) !== null) {
      if (m.index > last) push('plain', code.slice(last, m.index));
      if (m[1]) push('comment', m[1]);
      else if (m[2]) push('string', m[2]);
      else if (m[3]) {
        const kw = ext === 'py' ? PY_KEYWORDS.has(m[3]) : m[3] === 'true' || m[3] === 'false';
        push(kw ? 'keyword' : 'plain', m[3]);
      } else if (m[4]) push('number', m[4]);
      last = regex.lastIndex;
    }
    if (last < code.length) push('plain', code.slice(last));
    return tokens;
  }

  if (ext === 'sql') {
    const regex = /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:''|[^'])*')|\b([A-Za-z_][A-Za-z0-9_]*)\b|\b(\d+(?:\.\d+)?)\b/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(code)) !== null) {
      if (m.index > last) push('plain', code.slice(last, m.index));
      if (m[1]) push('comment', m[1]);
      else if (m[2]) push('string', m[2]);
      else if (m[3]) push(SQL_KEYWORDS.has(m[3].toLowerCase()) ? 'keyword' : 'plain', m[3]);
      else if (m[4]) push('number', m[4]);
      last = regex.lastIndex;
    }
    if (last < code.length) push('plain', code.slice(last));
    return tokens;
  }

  if (['js', 'mjs', 'cjs', 'ts', 'mts', 'tsx', 'jsx'].includes(ext)) {
    const regex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\[\s\S]|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b([A-Za-z_$][A-Za-z0-9_$]*)\b|\b(0x[0-9a-fA-F]+|\d+(?:\.\d+)?)\b/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(code)) !== null) {
      if (m.index > last) push('plain', code.slice(last, m.index));
      if (m[1]) push('comment', m[1]);
      else if (m[2]) push('string', m[2]);
      else if (m[3]) push(JS_KEYWORDS.has(m[3]) ? 'keyword' : 'plain', m[3]);
      else if (m[4]) push('number', m[4]);
      last = regex.lastIndex;
    }
    if (last < code.length) push('plain', code.slice(last));
    return tokens;
  }

  return [{ kind: 'plain', text: code }];
}

export function SyntaxEditor({
  value,
  onChangeText,
  filename,
  placeholder,
  readOnly = false,
}: SyntaxEditorProps) {
  const { colors, isDark } = useTheme();
  const [viewportWidth, setViewportWidth] = useState(320);

  const ext = useMemo(() => getFileExtension(filename), [filename]);
  const lines = useMemo(() => value.split('\n'), [value]);
  const lineCount = Math.max(1, lines.length);

  const gutterWidth = useMemo(() => {
    const digits = String(lineCount).length;
    return Math.max(38, digits * 9 + 18);
  }, [lineCount]);

  const maxLineLength = useMemo(() => {
    let max = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > max) max = lines[i].length;
    }
    return max;
  }, [lines]);

  const contentWidth = Math.max(
    viewportWidth,
    Math.ceil(maxLineLength * CHAR_WIDTH_ESTIMATE) + EDITOR_PAD_H * 2 + 32
  );
  const contentHeight = Math.max(320, lineCount * LINE_HEIGHT + EDITOR_PAD_V * 2 + 48);

  const tokenPalette = useMemo(() => {
    if (isDark) {
      return {
        plain: colors.text,
        keyword: '#C084FC',
        string: '#34D399',
        number: '#FBAD41',
        comment: '#6C6C74',
        tag: '#60A5FA',
        property: '#93C5FD',
      };
    }
    return {
      plain: colors.text,
      keyword: '#7C3AED',
      string: '#059669',
      number: '#D97706',
      comment: '#8E8E96',
      tag: '#2563EB',
      property: '#0369A1',
    };
  }, [isDark, colors.text]);

  const tokens = useMemo(() => {
    if (!value || value.length > MAX_HIGHLIGHT_CHARS) {
      return [{ kind: 'plain' as const, text: value }];
    }
    return tokenizeLineAware(value, ext);
  }, [value, ext]);

  const handleViewportLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setViewportWidth(w);
  };

  const monoFont = Fonts?.mono ?? (Platform.OS === 'ios' ? 'ui-monospace' : 'monospace');

  return (
    <ScrollView
      style={[styles.outerScroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.outerContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
    >
      <View style={styles.row}>
        {/* Line number gutter */}
        <View
          style={[
            styles.gutter,
            {
              width: gutterWidth,
              backgroundColor: colors.surfaceSecondary,
              borderRightColor: colors.borderLight,
              minHeight: contentHeight,
            },
          ]}
        >
          {lines.map((_, idx) => (
            <Text
              key={idx}
              style={[
                styles.lineNum,
                { color: colors.textTertiary, fontFamily: monoFont },
              ]}
            >
              {idx + 1}
            </Text>
          ))}
        </View>

        {/* Horizontal scroll code pane */}
        <ScrollView
          horizontal
          style={styles.horizontalScroll}
          onLayout={handleViewportLayout}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsHorizontalScrollIndicator
        >
          <View style={[styles.codeStage, { width: contentWidth, minHeight: contentHeight }]}>
            <Text
              selectable={false}
              style={[
                styles.highlightLayer,
                {
                  fontFamily: monoFont,
                  color: tokenPalette.plain,
                  width: contentWidth,
                  minHeight: contentHeight,
                },
              ]}
            >
              {value.length === 0 ? (
                <Text style={{ color: colors.textTertiary }}>{placeholder ?? ''}</Text>
              ) : (
                tokens.map((tok, i) => (
                  <Text key={i} style={{ color: tokenPalette[tok.kind] }}>
                    {tok.text}
                  </Text>
                ))
              )}
              {value.endsWith('\n') ? ' ' : ''}
            </Text>

            <TextInput
              value={value}
              onChangeText={onChangeText}
              editable={!readOnly}
              multiline
              scrollEnabled={false}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoComplete="off"
              textAlignVertical="top"
              selectionColor={colors.primary}
              cursorColor={colors.primary}
              style={[
                styles.inputLayer,
                {
                  fontFamily: monoFont,
                  width: contentWidth,
                  minHeight: contentHeight,
                },
                Platform.OS === 'web'
                  ? ({ caretColor: colors.primary, outlineStyle: 'none' } as any)
                  : null,
              ]}
            />
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerScroll: {
    flex: 1,
  },
  outerContent: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    flexGrow: 1,
    alignItems: 'stretch',
  },
  gutter: {
    paddingVertical: EDITOR_PAD_V,
    paddingHorizontal: Spacing.xs,
    borderRightWidth: 1,
    alignItems: 'flex-end',
  },
  lineNum: {
    fontSize: 11,
    lineHeight: LINE_HEIGHT,
    includeFontPadding: false,
  },
  horizontalScroll: {
    flex: 1,
  },
  codeStage: {
    position: 'relative',
  },
  highlightLayer: {
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    paddingVertical: EDITOR_PAD_V,
    paddingHorizontal: EDITOR_PAD_H,
    includeFontPadding: false,
    letterSpacing: 0,
  },
  inputLayer: {
    ...StyleSheet.absoluteFillObject,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    paddingVertical: EDITOR_PAD_V,
    paddingHorizontal: EDITOR_PAD_H,
    color: 'transparent',
    backgroundColor: 'transparent',
    includeFontPadding: false,
    letterSpacing: 0,
  },
});
