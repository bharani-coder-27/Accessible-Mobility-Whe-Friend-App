/**
 * Only the logo mark is bundled.
 *
 * Android flattens bundled asset filenames into resource names, dropping the
 * extension, so shipping both logo.png and logo.webp collided on a single
 * `assets_images_logo` resource and failed the release build. The profile
 * photo and the icon PNGs are gone too: avatars are generated from initials
 * and every icon now comes from the Ionicons font.
 */
export const images = {
  logoMark: require('../assets/images/logo.png'),
};
