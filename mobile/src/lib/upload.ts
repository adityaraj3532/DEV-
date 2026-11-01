import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { checkoutKey, supabase } from './supabase';
export async function pickProductImage() {
  const chosen = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1
  });
  if (chosen.canceled) return null;
  const asset = chosen.assets[0];
  const context = ImageManipulator.manipulate(asset.uri);
  context.resize({
    width: Math.min(1200, asset.width),
    height: null
  });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.75,
    base64: true
  });
  if (!result.base64) throw Error('Unable to read selected image');
  const decoded = atob(result.base64),
    bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
  if (bytes.byteLength > 1048576) throw Error('Choose a smaller image (compressed limit 1 MB).');
  const {
    data: {
      user
    },
    error
  } = await supabase.auth.getUser();
  if (error || !user) throw Error('Sign in before uploading');
  const path = `${user.id}/products/${checkoutKey()}.jpg`;
  const uploaded = await supabase.storage.from('electroshop-media').upload(path, bytes.buffer, {
    contentType: 'image/jpeg',
    upsert: false
  });
  if (uploaded.error) throw uploaded.error;
  return supabase.storage.from('electroshop-media').getPublicUrl(path).data.publicUrl;
}
