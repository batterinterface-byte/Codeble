import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/media_provider.dart';
import '../models/models.dart';

class QueueScreen extends StatelessWidget {
  const QueueScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Play Queue'),
        actions: [
          Consumer<MediaProvider>(
            builder: (context, provider, child) {
              return TextButton(
                onPressed: provider.audioPlayer.queue.isEmpty
                    ? null
                    : () {
                        provider.audioPlayer.clearQueue();
                        provider.refresh();
                      },
                child: const Text('Clear'),
              );
            },
          ),
        ],
      ),
      body: Consumer<MediaProvider>(
        builder: (context, provider, child) {
          final queue = provider.audioPlayer.queue;
          final currentIndex = provider.audioPlayer.currentIndex;

          if (queue.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.queue_music, size: 80, color: Colors.grey),
                  SizedBox(height: 16),
                  Text(
                    'Queue is empty',
                    style: TextStyle(fontSize: 18, color: Colors.grey),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${queue.length} tracks',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.grey[600],
                        ),
                      ),
                    ),
                    Text(
                      'Total: ${_formatTotalDuration(queue)}',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ReorderableListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: queue.length,
                  onReorder: (oldIndex, newIndex) {
                    provider.audioPlayer.moveQueueItem(oldIndex, newIndex);
                    provider.refresh();
                  },
                  itemBuilder: (context, index) {
                    final item = queue[index];
                    final isCurrent = index == currentIndex;

                    return Card(
                      key: ValueKey(item.id),
                      child: ListTile(
                        leading: Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: isCurrent
                                ? Theme.of(context).colorScheme.primary
                                : Colors.grey[200],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            isCurrent ? Icons.equalizer : Icons.music_note,
                            color: isCurrent ? Colors.white : Colors.grey[600],
                          ),
                        ),
                        title: Text(
                          item.title,
                          style: TextStyle(
                            fontWeight: isCurrent ? FontWeight.bold : null,
                            color: isCurrent
                                ? Theme.of(context).colorScheme.primary
                                : null,
                          ),
                        ),
                        subtitle: Text(item.artist),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(item.formattedDuration),
                            IconButton(
                              icon: const Icon(Icons.remove_circle_outline),
                              onPressed: () {
                                provider.audioPlayer.removeFromQueue(index);
                                provider.refresh();
                              },
                            ),
                            const Icon(Icons.drag_handle, color: Colors.grey),
                          ],
                        ),
                        onTap: () {
                          provider.audioPlayer.playQueue(queue, startIndex: index);
                        },
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  String _formatTotalDuration(List<MediaItem> queue) {
    final total = queue.fold(Duration.zero, (prev, item) => prev + item.duration);
    final hours = total.inHours;
    final minutes = total.inMinutes % 60;
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    }
    return '${minutes}m';
  }
}
