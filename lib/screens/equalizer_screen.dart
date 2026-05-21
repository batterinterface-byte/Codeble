import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/media_provider.dart';
import '../services/audio_effects_service.dart';

class EqualizerScreen extends StatefulWidget {
  const EqualizerScreen({super.key});

  @override
  State<EqualizerScreen> createState() => _EqualizerScreenState();
}

class _EqualizerScreenState extends State<EqualizerScreen> {
  final List<String> _bandLabels = [
    '31Hz', '62Hz', '125Hz', '250Hz', '500Hz',
    '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Audio Effects'),
        actions: [
          IconButton(
            icon: const Icon(Icons.restore),
            onPressed: () {
              final provider = Provider.of<MediaProvider>(context, listen: false);
              provider.audioEffects.resetAllEffects();
              setState(() {});
            },
            tooltip: 'Reset All',
          ),
        ],
      ),
      body: Consumer<MediaProvider>(
        builder: (context, provider, child) {
          final effects = provider.audioEffects;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildPresetSelector(effects),
                const SizedBox(height: 24),
                _buildSectionTitle('Equalizer'),
                _buildEqualizerGraph(effects),
                const SizedBox(height: 16),
                _buildEqualizerSliders(effects),
                const SizedBox(height: 24),
                _buildSectionTitle('Audio Effects'),
                _buildEffectSlider(
                  'Bass Boost',
                  effects.bassBoost,
                  Icons.graphic_eq,
                  (value) => effects.setBassBoost(value),
                ),
                _buildEffectSlider(
                  'Virtualizer',
                  effects.virtualizer,
                  Icons.surround_sound,
                  (value) => effects.setVirtualizer(value),
                ),
                _buildEffectSlider(
                  'Reverb',
                  effects.reverb,
                  Icons.audiotrack,
                  (value) => effects.setReverb(value),
                ),
                _buildEffectSlider(
                  '3D Surround',
                  effects.surround3D,
                  Icons.spatial_audio,
                  (value) => effects.setSurround3D(value),
                ),
                _buildEffectSlider(
                  'Loudness Enhancer',
                  effects.loudnessEnhancer,
                  Icons.volume_up,
                  (value) => effects.setLoudnessEnhancer(value),
                ),
                const SizedBox(height: 16),
                SwitchListTile(
                  title: const Text('Audio Normalization'),
                  subtitle: const Text('Normalize volume across all tracks'),
                  value: effects.isNormalizationEnabled,
                  onChanged: (value) {
                    effects.toggleNormalization(value);
                    setState(() {});
                  },
                  secondary: const Icon(Icons.auto_fix_high),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildPresetSelector(AudioEffectsService effects) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Presets',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: AudioEffectsService.equalizerPresets.keys.map((preset) {
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: Text(preset),
                  selected: false,
                  onSelected: (selected) {
                    effects.applyPreset(preset);
                    setState(() {});
                  },
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildEqualizerGraph(AudioEffectsService effects) {
    return Container(
      height: 150,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: CustomPaint(
        painter: EqualizerGraphPainter(effects.equalizerBands),
        child: const SizedBox.expand(),
      ),
    );
  }

  Widget _buildEqualizerSliders(AudioEffectsService effects) {
    return Column(
      children: List.generate(effects.equalizerBands.length, (index) {
        return Row(
          children: [
            SizedBox(
              width: 50,
              child: Text(
                _bandLabels[index],
                style: const TextStyle(fontSize: 12),
              ),
            ),
            Expanded(
              child: Slider(
                value: effects.equalizerBands[index],
                min: -12,
                max: 12,
                divisions: 24,
                label: '${effects.equalizerBands[index].toStringAsFixed(1)} dB',
                onChanged: (value) {
                  effects.setEqualizerBand(index, value);
                  setState(() {});
                },
              ),
            ),
            SizedBox(
              width: 50,
              child: Text(
                '${effects.equalizerBands[index].toStringAsFixed(1)} dB',
                style: const TextStyle(fontSize: 12),
                textAlign: TextAlign.right,
              ),
            ),
          ],
        );
      }),
    );
  }

  Widget _buildEffectSlider(
    String title,
    double value,
    IconData icon,
    ValueChanged<double> onChanged,
  ) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: Slider(
        value: value,
        min: 0,
        max: 100,
        divisions: 100,
        label: '${value.toInt()}%',
        onChanged: (v) {
          onChanged(v);
          setState(() {});
        },
      ),
      trailing: Text('${value.toInt()}%'),
    );
  }
}

class EqualizerGraphPainter extends CustomPainter {
  final List<double> bands;

  EqualizerGraphPainter(this.bands);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.blue
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    final fillPaint = Paint()
      ..color = Colors.blue.withOpacity(0.2)
      ..style = PaintingStyle.fill;

    final path = Path();
    final fillPath = Path();

    final bandWidth = size.width / (bands.length - 1);
    final midY = size.height / 2;
    final maxDeviation = size.height / 2 - 10;

    for (int i = 0; i < bands.length; i++) {
      final x = i * bandWidth;
      final normalizedValue = bands[i] / 12;
      final y = midY - (normalizedValue * maxDeviation);

      if (i == 0) {
        path.moveTo(x, y);
        fillPath.moveTo(x, size.height);
        fillPath.lineTo(x, y);
      } else {
        path.lineTo(x, y);
        fillPath.lineTo(x, y);
      }

      if (i == bands.length - 1) {
        fillPath.lineTo(x, size.height);
        fillPath.close();
      }
    }

    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(path, paint);

    for (int i = 0; i < bands.length; i++) {
      final x = i * bandWidth;
      final normalizedValue = bands[i] / 12;
      final y = midY - (normalizedValue * maxDeviation);

      canvas.drawCircle(
        Offset(x, y),
        5,
        Paint()..color = Colors.blue,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
