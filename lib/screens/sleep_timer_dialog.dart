import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/media_provider.dart';

class SleepTimerDialog extends StatefulWidget {
  const SleepTimerDialog({super.key});

  @override
  State<SleepTimerDialog> createState() => _SleepTimerDialogState();
}

class _SleepTimerDialogState extends State<SleepTimerDialog> {
  Duration _selectedDuration = const Duration(minutes: 30);
  final List<Duration> _presetDurations = [
    const Duration(minutes: 5),
    const Duration(minutes: 10),
    const Duration(minutes: 15),
    const Duration(minutes: 30),
    const Duration(minutes: 45),
    const Duration(hours: 1),
    const Duration(hours: 2),
  ];

  @override
  Widget build(BuildContext context) {
    return Consumer<MediaProvider>(
      builder: (context, provider, child) {
        final sleepTimer = provider.sleepTimer;

        if (sleepTimer.isActive) {
          return _buildActiveTimer(context, sleepTimer, provider);
        }

        return AlertDialog(
          title: const Text('Sleep Timer'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Stop playback after:'),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _presetDurations.map((duration) {
                  final isSelected = duration == _selectedDuration;
                  return ChoiceChip(
                    label: Text(_formatDuration(duration)),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() => _selectedDuration = duration);
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Text('Custom:'),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Slider(
                      value: _selectedDuration.inMinutes.toDouble(),
                      min: 1,
                      max: 180,
                      divisions: 179,
                      label: '${_selectedDuration.inMinutes} min',
                      onChanged: (value) {
                        setState(() {
                          _selectedDuration = Duration(minutes: value.toInt());
                        });
                      },
                    ),
                  ),
                  Text('${_selectedDuration.inMinutes}m'),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                sleepTimer.start(
                  _selectedDuration,
                  onComplete: () {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Sleep timer ended. Playback stopped.'),
                        ),
                      );
                    }
                  },
                );
                Navigator.pop(context);
              },
              child: const Text('Start Timer'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildActiveTimer(
    BuildContext context,
    dynamic sleepTimer,
    dynamic provider,
  ) {
    return AlertDialog(
      title: const Text('Sleep Timer Active'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.timer, size: 64, color: Colors.blue),
          const SizedBox(height: 16),
          Text(
            sleepTimer.formattedRemaining,
            style: const TextStyle(
              fontSize: 36,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Remaining',
            style: TextStyle(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 16),
          LinearProgressIndicator(value: sleepTimer.progress),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              ElevatedButton.icon(
                onPressed: () {
                  sleepTimer.addTime(const Duration(minutes: 15));
                  setState(() {});
                },
                icon: const Icon(Icons.add),
                label: const Text('+15 min'),
              ),
              ElevatedButton.icon(
                onPressed: () {
                  sleepTimer.cancel();
                  setState(() {});
                },
                icon: const Icon(Icons.cancel),
                label: const Text('Cancel'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Close'),
        ),
      ],
    );
  }

  String _formatDuration(Duration d) {
    if (d.inHours > 0) {
      return '${d.inHours}h ${d.inMinutes % 60}m';
    }
    return '${d.inMinutes}m';
  }
}
