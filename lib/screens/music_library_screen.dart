import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/media_provider.dart';
import '../models/models.dart';
import 'enhanced_now_playing_screen.dart';

enum SortOption { title, artist, album, duration, dateAdded }

class MusicLibraryScreen extends StatefulWidget {
  const MusicLibraryScreen({super.key});

  @override
  State<MusicLibraryScreen> createState() => _MusicLibraryScreenState();
}

class _MusicLibraryScreenState extends State<MusicLibraryScreen> {
  SortOption _sortOption = SortOption.title;
  String _viewMode = 'list';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<MediaProvider>(
        builder: (context, provider, child) {
          final audioFiles = provider.audioFiles;

          if (audioFiles.isEmpty) {
            return _buildEmptyState(context, provider);
          }

          return Column(
            children: [
              _buildHeader(context, provider),
              _buildSortOptions(),
              Expanded(
                child: _viewMode == 'list'
                    ? _buildListView(audioFiles, provider)
                    : _buildGridView(audioFiles, provider),
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
            'No music files found',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => provider.scanMedia(),
            icon: const Icon(Icons.folder_open),
            label: const Text('Scan Device'),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => provider.addMediaFiles(),
            icon: const Icon(Icons.add),
            label: const Text('Add Files'),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, MediaProvider provider) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: Text(
              '${provider.audioFiles.length} songs',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          IconButton(
            icon: Icon(_viewMode == 'list' ? Icons.grid_on : Icons.list),
            onPressed: () {
              setState(() {
                _viewMode = _viewMode == 'list' ? 'grid' : 'list';
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              showSearch(
                context: context,
                delegate: MusicSearchDelegate(provider),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSortOptions() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          _buildSortChip('Title', SortOption.title),
          const SizedBox(width: 8),
          _buildSortChip('Artist', SortOption.artist),
          const SizedBox(width: 8),
          _buildSortChip('Album', SortOption.album),
          const SizedBox(width: 8),
          _buildSortChip('Duration', SortOption.duration),
          const SizedBox(width: 8),
          _buildSortChip('Recently Added', SortOption.dateAdded),
        ],
      ),
    );
  }

  Widget _buildSortChip(String label, SortOption option) {
    final isSelected = _sortOption == option;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _sortOption = option;
        });
      },
    );
  }

  Widget _buildListView(List<MediaItem> audioFiles, MediaProvider provider) {
    final sortedFiles = _getSortedFiles(audioFiles);

    return ListView.builder(
      itemCount: sortedFiles.length,
      itemBuilder: (context, index) {
        final item = sortedFiles[index];
        final isPlaying = provider.audioPlayer.currentMediaItem?.id == item.id;

        return ListTile(
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
              fontWeight: isPlaying ? FontWeight.bold : FontWeight.normal,
              color: isPlaying ? Theme.of(context).colorScheme.primary : null,
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
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert, size: 20),
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'play_next',
                    child: Text('Play Next'),
                  ),
                  const PopupMenuItem(
                    value: 'add_to_queue',
                    child: Text('Add to Queue'),
                  ),
                  const PopupMenuItem(
                    value: 'add_to_playlist',
                    child: Text('Add to Playlist'),
                  ),
                  PopupMenuItem(
                    value: 'toggle_favorite',
                    child: Text(item.isFavorite
                        ? 'Remove from Favorites'
                        : 'Add to Favorites'),
                  ),
                ],
                onSelected: (value) {
                  _handleMenuAction(value, item, provider);
                },
              ),
            ],
          ),
          onTap: () {
            provider.playMedia(item, queue: sortedFiles);
          },
          onLongPress: () {
            _showItemOptions(context, item, provider);
          },
        );
      },
    );
  }

  Widget _buildGridView(List<MediaItem> audioFiles, MediaProvider provider) {
    final sortedFiles = _getSortedFiles(audioFiles);

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.8,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: sortedFiles.length,
      itemBuilder: (context, index) {
        final item = sortedFiles[index];
        final isPlaying = provider.audioPlayer.currentMediaItem?.id == item.id;

        return GestureDetector(
          onTap: () {
            provider.playMedia(item, queue: sortedFiles);
          },
          child: Container(
            decoration: BoxDecoration(
              color: isPlaying
                  ? Theme.of(context).colorScheme.primary.withOpacity(0.1)
                  : Colors.grey[100],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: isPlaying
                        ? Theme.of(context).colorScheme.primary
                        : Colors.grey[300],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    isPlaying ? Icons.equalizer : Icons.music_note,
                    size: 40,
                    color: isPlaying ? Colors.white : Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Text(
                    item.title,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontWeight: isPlaying ? FontWeight.bold : null,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  item.artist,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  List<MediaItem> _getSortedFiles(List<MediaItem> files) {
    final sorted = List<MediaItem>.from(files);
    switch (_sortOption) {
      case SortOption.title:
        sorted.sort((a, b) => a.title.compareTo(b.title));
        break;
      case SortOption.artist:
        sorted.sort((a, b) {
          final artistCompare = a.artist.compareTo(b.artist);
          return artistCompare != 0 ? artistCompare : a.title.compareTo(b.title);
        });
        break;
      case SortOption.album:
        sorted.sort((a, b) {
          final albumCompare = a.album.compareTo(b.album);
          return albumCompare != 0 ? albumCompare : a.title.compareTo(b.title);
        });
        break;
      case SortOption.duration:
        sorted.sort((a, b) => b.duration.compareTo(a.duration));
        break;
      case SortOption.dateAdded:
        sorted.sort((a, b) => b.dateAdded.compareTo(a.dateAdded));
        break;
    }
    return sorted;
  }

  void _handleMenuAction(String action, MediaItem item, MediaProvider provider) {
    switch (action) {
      case 'play_next':
        final queue = List<MediaItem>.from(provider.audioPlayer.queue);
        final insertIndex = provider.audioPlayer.currentIndex + 1;
        queue.insert(insertIndex, item);
        provider.audioPlayer.playQueue(queue, startIndex: insertIndex);
        break;
      case 'add_to_queue':
        final queue = List<MediaItem>.from(provider.audioPlayer.queue);
        queue.add(item);
        provider.audioPlayer.playQueue(queue,
            startIndex: provider.audioPlayer.currentIndex);
        break;
      case 'add_to_playlist':
        _showAddToPlaylistDialog(context, item, provider);
        break;
      case 'toggle_favorite':
        provider.toggleFavorite(item);
        break;
    }
  }

  void _showItemOptions(
      BuildContext context, MediaItem item, MediaProvider provider) {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.play_arrow),
                title: const Text('Play'),
                onTap: () {
                  provider.playMedia(item);
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(Icons.playlist_add),
                title: const Text('Add to Queue'),
                onTap: () {
                  final queue =
                      List<MediaItem>.from(provider.audioPlayer.queue);
                  queue.add(item);
                  provider.audioPlayer.playQueue(queue,
                      startIndex: provider.audioPlayer.currentIndex);
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(Icons.playlist_play),
                title: const Text('Add to Playlist'),
                onTap: () {
                  Navigator.pop(context);
                  _showAddToPlaylistDialog(context, item, provider);
                },
              ),
              ListTile(
                leading: Icon(
                    item.isFavorite ? Icons.favorite : Icons.favorite_border),
                title: Text(item.isFavorite
                    ? 'Remove from Favorites'
                    : 'Add to Favorites'),
                onTap: () {
                  provider.toggleFavorite(item);
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showAddToPlaylistDialog(
      BuildContext context, MediaItem item, MediaProvider provider) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Add to Playlist'),
          content: SizedBox(
            width: double.maxFinite,
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: provider.playlists.length,
              itemBuilder: (context, index) {
                final playlist = provider.playlists[index];
                return ListTile(
                  title: Text(playlist.name),
                  subtitle: Text('${playlist.items.length} songs'),
                  onTap: () {
                    provider.addToPlaylist(playlist.id, item);
                    Navigator.pop(context);
                  },
                );
              },
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
          ],
        );
      },
    );
  }
}

class MusicSearchDelegate extends SearchDelegate<String> {
  final MediaProvider provider;

  MusicSearchDelegate(this.provider);

  @override
  List<Widget> buildActions(BuildContext context) {
    return [
      IconButton(
        icon: const Icon(Icons.clear),
        onPressed: () {
          query = '';
        },
      ),
    ];
  }

  @override
  Widget buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () {
        close(context, '');
      },
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    return _buildSearchResults();
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    return _buildSearchResults();
  }

  Widget _buildSearchResults() {
    final results = provider.audioFiles.where((item) {
      final queryLower = query.toLowerCase();
      return item.title.toLowerCase().contains(queryLower) ||
          item.artist.toLowerCase().contains(queryLower) ||
          item.album.toLowerCase().contains(queryLower);
    }).toList();

    return ListView.builder(
      itemCount: results.length,
      itemBuilder: (context, index) {
        final item = results[index];
        return ListTile(
          leading: const Icon(Icons.music_note),
          title: Text(item.title),
          subtitle: Text('${item.artist} • ${item.album}'),
          trailing: Text(item.formattedDuration),
          onTap: () {
            provider.playMedia(item, queue: results);
          },
        );
      },
    );
  }
}
