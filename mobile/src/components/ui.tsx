import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { router } from 'expo-router';
export const theme = {
  navy: '#101e32',
  orange: '#d75313',
  muted: '#607088',
  line: '#dee5ee',
  bg: '#f5f7fb'
};
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({
    pressed
  }) => [styles.button, secondary && styles.secondary, {
    opacity: disabled ? 0.4 : pressed ? 0.75 : 1
  }]}><Text style={{
      fontWeight: '700',
      color: secondary ? theme.navy : '#fff'
    }}>{title}</Text></Pressable>;
}
export function Card({
  children
}: {
  children: React.ReactNode;
}) {
  return <View style={styles.card}>{children}</View>;
}
export function Field({
  label,
  ...props
}: TextInputProps & {
  label: string;
}) {
  return <View style={{
    gap: 7,
    marginBottom: 14
  }}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor="#8490a2" style={[styles.input, props.multiline && {
      minHeight: 95,
      textAlignVertical: 'top'
    }]} {...props} /></View>;
}
export function Title({
  children
}: {
  children: React.ReactNode;
}) {
  return <Text style={styles.title}>{children}</Text>;
}
export function Muted({
  children
}: {
  children: React.ReactNode;
}) {
  return <Text style={styles.muted}>{children}</Text>;
}
export function Row({
  children
}: {
  children: React.ReactNode;
}) {
  return <View style={styles.row}>{children}</View>;
}
export function Shell({
  children
}: {
  children: React.ReactNode;
}) {
  return <SafeAreaView style={{flex:1,backgroundColor:theme.bg}}><ScrollView style={{
    backgroundColor: theme.bg
  }} contentContainerStyle={{
    padding: 20,
    paddingBottom: 55
  }}><View style={{
      maxWidth: 1180,
      width: '100%',
      alignSelf: 'center',
      gap: 16
    }}><View style={styles.header}><Text style={styles.logo}>DC</Text><View style={{
          flex: 1
        }}><Text style={{
            fontSize: 23,
            fontWeight: '800',
            color: theme.navy
          }}>Dev Computer</Text><Muted>Your technology. Your way.</Muted></View></View><Row><Button title="Shop" secondary onPress={() => router.push('/')} /><Button title="Cart" secondary onPress={() => router.push('/cart')} /><Button title="Offers" secondary onPress={() => router.push('/offers')} /><Button title="Account" secondary onPress={() => router.push('/account')} /><Button title="Owner" secondary onPress={() => router.push('/admin')} /></Row>{children}</View></ScrollView></SafeAreaView>;
}
export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: 13,
    alignItems: 'center',
    marginBottom: 4
  },
  logo: {
    backgroundColor: '#ff8c43',
    padding: 12,
    borderRadius: 12,
    fontSize: 22,
    fontWeight: '900',
    color: theme.navy
  },
  title: {
    fontSize: 25,
    lineHeight: 33,
    fontWeight: '800',
    color: theme.navy,
    marginBottom: 8
  },
  muted: {
    color: theme.muted,
    fontSize: 14,
    lineHeight: 22
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.navy
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 10,
    padding: 13,
    color: theme.navy,
    fontSize: 15
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 20,
    gap: 11
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10
  },
  button: {
    backgroundColor: theme.orange,
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.line
  },
  price: {
    fontSize: 23,
    fontWeight: '800',
    color: theme.orange
  },
  hero: {
    backgroundColor: theme.navy,
    padding: 28,
    borderRadius: 21,
    gap: 10
  }
});
