import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/media_provider.dart';
import '../models/models.dart';

class PlaylistDetailScreen extends StatelessWidget {
  final Playlist playlist;

  const PlaylistDetailScreen({super.key, required this.playlist});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(playlist.name),
        actions: [
          IconButton(
            icon: const Icon(Icons.shuffle),
            onPressed: () {
              final provider = Provider.of<MediaProvider>(context, listen: false);
              final shuffled = List<MediaItem>.from(playlist.items)..shuffle();
              if (shuffled.isNotEmpty) {
                provider.audioPlayer.playQueue(shuffled);
              }
            },
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'add_songs',
                child: Text('Add Songs'),
              ),
              const PopupMenuItem(
                value: 'rename',
                child: Text('Rename'),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: Text('Delete Playlist'),
              ),
            ],
            onSelected: (value) {
              _handleMenuAction(value, context);
            },
          ),
        ],
      ),
      body: Consumer<MediaProvider>(
        builder: (context, provider, child) {
          if (playlist.items.isEmpty) {
            return _buildEmptyState(context, provider);
          }

          return Column(
            children: [
              _buildPlaylistHeader(context, provider),
              Expanded(
                child: ReorderableListView.builder(
                  itemCount: playlist.items.length,
                  onReorder: (oldIndex, newIndex) {
                    _reorderItems(oldIndex, newIndex, provider, context);
                  },
                  itemBuilder: (context, index) {
                    final item = playlist.items[index];
                    final isPlaying =
                        provider.audioPlayer.currentMediaItem?.id == item.id;

                    return ListTile(
                      key: ValueKey(item.id),
                      leading: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: isPlaying
                              ? Theme.of(context).colorScheme.primary
                              : Colors.grey[200],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          isPlaying ? Icons.equalizer : Icons.music_note,
                          color: isPlaying ? Colors.white : Colors.grey[600],
                        ),
                      ),
                      title: Text(
                        item.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontWeight:
                              isPlaying ? FontWeight.bold : FontWeight.normal,
                          color: isPlaying
                              ? Theme.of(context).colorScheme.primary
                              : null,
                        ),
                      ),
                      subtitle: Text(
                        '${item.artist} • ${item.album}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(item.formattedDuration),
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline,
                                size: 20),
                            onPressed: () {
                              provider.removeFromPlaylist(
                                  playlist.id, item.id);
                            },
                          ),
                        ],
                      ),
                      onTap: () {
                        provider.playMedia(item, queue: playlist.items);
                      },
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

  Widget _buildEmptyState(BuildContext context, MediaProvider provider) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.music_off,
            size: 80,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'This playlist is empty',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => _showAddSongsDialog(context, provider),
            icon: const Icon(Icons.add),
            label: const Text('Add Songs'),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaylistHeader(BuildContext context, MediaProvider provider) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: Text(
              '${playlist.items.length} songs • ${playlist.formattedDuration}',
              style: TextStyle(
                color: Colors.grey[600],
              ),
            ),
          ),
          ElevatedButton.icon(
            onPressed: () {
              if (playlist.items.isNotEmpty) {
                provider.audioPlayer.playQueue(playlist.items);
              }
            },
            icon: const Icon(Icons.play_arrow),
            label: const Text('Play All'),
          ),
          const SizedBox(width: 8),
          OutlinedButton.icon(
            onPressed: () => _showAddSongsDialog(context, provider),
            icon: const Icon(Icons.add),
            label: const Text('Add'),
          ),
        ],
      ),
    );
  }

  void _reorderItems(int oldIndex, int newIndex, MediaProvider provider, BuildContext context) {
    if (newIndex > oldIndex) {
      newIndex -= 1;
    }
    final item = playlist.items.removeAt(oldIndex);
    playlist.items.insert(newIndex, item);
    playlist.lastModified = DateTime.now();
    provider.storage.savePlaylists(provider.playlists);
    _notifyProvider(context);
  }

  void _notifyProvider(BuildContext context) {
    final provider = Provider.of<MediaProvider>(context, listen: false);
    provider.refresh();
  }

  void _showAddSongsDialog(BuildContext context, MediaProvider provider) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          expand: false,
          builder: (context, scrollController) {
            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Add Songs',
                        style: TextStyle(
                            fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    controller: scrollController,
                    itemCount: provider.audioFiles.length,
                    itemBuilder: (context, index) {
                      final item = provider.audioFiles[index];
                      final isInPlaylist =
                          playlist.items.any((i) => i.id == item.id);

                      return ListTile(
                        leading: const Icon(Icons.music_note),
                        title: Text(item.title),
                        subtitle: Text('${item.artist} • ${item.album}'),
                        trailing: isInPlaylist
                            ? const Icon(Icons.check, color: Colors.green)
                            : IconButton(
                                icon: const Icon(Icons.add),
                                onPressed: () {
                                  provider.addToPlaylist(playlist.id, item);
                                },
                              ),
                        enabled: !isInPlaylist,
                      );
                    },
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _handleMenuAction(String action, BuildContext context) {
    final provider = Provider.of<MediaProvider>(context, listen: false);

    switch (action) {
      case 'add_songs':
        _showAddSongsDialog(context, provider);
        break;
      case 'rename':
        _showRenameDialog(context, provider);
        break;
      case 'delete':
        _showDeleteConfirmation(context, provider);
        break;
    }
  }

  void _showRenameDialog(BuildContext context, MediaProvider provider) {
    final controller = TextEditingController(text: playlist.name);

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Rename Playlist'),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(
              labelText: 'Playlist Name',
            ),
            autofocus: true,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final name = controller.text.trim();
                if (name.isNotEmpty) {
                  provider.renamePlaylist(playlist.id, name);
                  Navigator.pop(context);
                }
              },
              child: const Text('Rename'),
            ),
          ],
        );
      },
    );
  }

  void _showDeleteConfirmation(BuildContext context, MediaProvider provider) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete Playlist'),
          content: Text('Are you sure you want to delete "${playlist.name}"?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                provider.deletePlaylist(playlist.id);
                Navigator.pop(context);
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );
  }
}
