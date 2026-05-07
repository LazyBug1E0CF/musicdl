import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  bitrateTagClassName,
  buildBitrateMetadata,
  estimateBitrateKbps,
  formatTagClassName,
  getBitrateTier,
  getFormatTone,
} from '../src/utils/resultMetadata.ts';

describe('result metadata normalization', () => {
  it('formats exact bitrate and assigns the highest gold tier', () => {
    const metadata = buildBitrateMetadata({ bitrate: 320, file_size_bytes: 1, duration_s: 1 });

    assert.equal(metadata.label, '320 kbps');
    assert.equal(metadata.kind, 'exact');
    assert.equal(metadata.tier, 'tier-5');
    assert.equal(metadata.value, 320);
  });

  it('estimates missing bitrate from file size and duration', () => {
    const fileSizeBytes = 5 * 1024 * 1024;
    const metadata = buildBitrateMetadata({ file_size_bytes: fileSizeBytes, duration_s: 210 });

    assert.equal(estimateBitrateKbps({ file_size_bytes: fileSizeBytes, duration_s: 210 }), 200);
    assert.equal(metadata.label, '~200 kbps');
    assert.equal(metadata.kind, 'estimated');
    assert.equal(metadata.tier, 'tier-3');
    assert.equal(metadata.value, 200);
  });

  it('estimates missing bitrate from display size and duration strings', () => {
    const metadata = buildBitrateMetadata({ file_size: '4.8 MB', duration: '00:03:30' });

    assert.equal(metadata.label, '~192 kbps');
    assert.equal(metadata.kind, 'estimated');
    assert.equal(metadata.tier, 'tier-3');
    assert.equal(metadata.value, 192);
  });

  it('falls back when missing bitrate cannot be estimated', () => {
    const metadata = buildBitrateMetadata({ codec: 'aac', file_size_bytes: 0, duration_s: 210 });

    assert.equal(metadata.label, 'aac');
    assert.equal(metadata.kind, 'fallback');
    assert.equal(metadata.tier, 'unknown');
    assert.equal(metadata.value, undefined);
  });

  it('maps bitrate values to green-to-gold quality tiers', () => {
    assert.equal(getBitrateTier(96), 'tier-1');
    assert.equal(getBitrateTier(128), 'tier-2');
    assert.equal(getBitrateTier(192), 'tier-3');
    assert.equal(getBitrateTier(256), 'tier-4');
    assert.equal(getBitrateTier(320), 'tier-5');
    assert.equal(getBitrateTier(undefined), 'unknown');
  });

  it('maps formats and generated tag class names for result rendering', () => {
    assert.equal(getFormatTone('flac'), 'lossless');
    assert.equal(getFormatTone('mp3'), 'mp3');
    assert.equal(getFormatTone('m4a'), 'aac');
    assert.equal(getFormatTone('opus'), 'opus');
    assert.equal(getFormatTone('wav'), 'wave');
    assert.equal(getFormatTone('strange-format'), 'default');
    assert.equal(formatTagClassName('mp3'), 'metadata-tag metadata-tag-format metadata-tag-format-mp3');
    assert.equal(
      bitrateTagClassName('tier-5', 'estimated'),
      'metadata-tag metadata-tag-bitrate metadata-tag-bitrate-tier-5 metadata-tag-estimated',
    );
  });
});
