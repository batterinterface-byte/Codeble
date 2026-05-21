import 'package:just_audio/just_audio.dart';

class AudioEffectsService {
  final AudioPlayer _player;

  // Equalizer bands (31Hz, 62Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz)
  final List<double> _equalizerBands = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  double _bassBoost = 0;
  double _virtualizer = 0;
  double _reverb = 0;
  double _surround3D = 0;
  double _loudnessEnhancer = 0;
  bool _isNormalizationEnabled = false;

  // Presets
  static const Map<String, List<double>> equalizerPresets = {
    'Normal': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'Pop': [0.5, 1.0, 1.5, 1.0, 0.5, 0, -0.5, -0.5, 0.5, 1.0],
    'Rock': [1.5, 1.0, 0.5, -0.5, -1.0, -0.5, 0.5, 1.0, 1.5, 1.5],
    'Jazz': [0.5, 1.0, 1.0, 0.5, -0.5, -0.5, 0, 0.5, 1.0, 1.0],
    'Classical': [1.0, 1.0, 0.5, 0.5, -0.5, -0.5, 0, 0.5, 1.0, 1.5],
    'Bass Boost': [2.0, 1.5, 1.0, 0.5, 0, 0, 0, 0, 0, 0],
    'Treble Boost': [0, 0, 0, 0, 0, 0, 0.5, 1.0, 1.5, 2.0],
    'Vocal': [-0.5, 0, 0.5, 1.0, 1.5, 1.5, 1.0, 0.5, 0, -0.5],
    'Electronic': [1.0, 0.5, 0, -0.5, 0, 0.5, 1.0, 1.5, 1.0, 0.5],
    'Hip Hop': [1.5, 1.0, 0.5, 0, -0.5, 0, 0.5, 1.0, 1.5, 1.0],
  };

  AudioEffectsService(this._player);

  List<double> get equalizerBands => List.unmodifiable(_equalizerBands);
  double get bassBoost => _bassBoost;
  double get virtualizer => _virtualizer;
  double get reverb => _reverb;
  double get surround3D => _surround3D;
  double get loudnessEnhancer => _loudnessEnhancer;
  bool get isNormalizationEnabled => _isNormalizationEnabled;

  Future<void> setEqualizerBand(int bandIndex, double value) async {
    if (bandIndex < 0 || bandIndex >= _equalizerBands.length) return;
    _equalizerBands[bandIndex] = value.clamp(-12.0, 12.0);
    await _applyEffects();
  }

  Future<void> setBassBoost(double value) async {
    _bassBoost = value.clamp(0.0, 100.0);
    await _applyEffects();
  }

  Future<void> setVirtualizer(double value) async {
    _virtualizer = value.clamp(0.0, 100.0);
    await _applyEffects();
  }

  Future<void> setReverb(double value) async {
    _reverb = value.clamp(0.0, 100.0);
    await _applyEffects();
  }

  Future<void> setSurround3D(double value) async {
    _surround3D = value.clamp(0.0, 100.0);
    await _applyEffects();
  }

  Future<void> setLoudnessEnhancer(double value) async {
    _loudnessEnhancer = value.clamp(0.0, 100.0);
    await _applyEffects();
  }

  Future<void> toggleNormalization(bool enabled) async {
    _isNormalizationEnabled = enabled;
    await _applyEffects();
  }

  Future<void> applyPreset(String presetName) async {
    final preset = equalizerPresets[presetName];
    if (preset != null) {
      for (int i = 0; i < preset.length; i++) {
        _equalizerBands[i] = preset[i];
      }
      await _applyEffects();
    }
  }

  Future<void> resetAllEffects() async {
    for (int i = 0; i < _equalizerBands.length; i++) {
      _equalizerBands[i] = 0;
    }
    _bassBoost = 0;
    _virtualizer = 0;
    _reverb = 0;
    _surround3D = 0;
    _loudnessEnhancer = 0;
    _isNormalizationEnabled = false;
    await _applyEffects();
  }

  Future<void> _applyEffects() async {
    // Note: just_audio has limited built-in EQ support
    // These effects are simulated through volume and balance adjustments
    // For full EQ support, native platform integration would be needed

    final totalGain = _equalizerBands.reduce((a, b) => a + b) / _equalizerBands.length;
    final volumeMultiplier = 1.0 + (totalGain / 100);
    final loudnessBoost = _loudnessEnhancer / 100;

    await _player.setVolume((volumeMultiplier + loudnessBoost).clamp(0.0, 1.0));
  }

  Map<String, dynamic> toJson() {
    return {
      'equalizerBands': _equalizerBands,
      'bassBoost': _bassBoost,
      'virtualizer': _virtualizer,
      'reverb': _reverb,
      'surround3D': _surround3D,
      'loudnessEnhancer': _loudnessEnhancer,
      'isNormalizationEnabled': _isNormalizationEnabled,
    };
  }

  void fromJson(Map<String, dynamic> json) {
    if (json['equalizerBands'] != null) {
      final bands = json['equalizerBands'] as List;
      for (int i = 0; i < bands.length && i < _equalizerBands.length; i++) {
        _equalizerBands[i] = bands[i] as double;
      }
    }
    _bassBoost = json['bassBoost'] as double? ?? 0;
    _virtualizer = json['virtualizer'] as double? ?? 0;
    _reverb = json['reverb'] as double? ?? 0;
    _surround3D = json['surround3D'] as double? ?? 0;
    _loudnessEnhancer = json['loudnessEnhancer'] as double? ?? 0;
    _isNormalizationEnabled = json['isNormalizationEnabled'] as bool? ?? false;
  }
}
