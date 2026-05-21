import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/media_provider.dart';
import '../models/models.dart';
import 'enhanced_video_player.dart';

class VideoLibraryScreen extends StatefulWidget {
  const VideoLibraryScreen({super.key});

  @override
  State<VideoLibraryScreen> createState() => _VideoLibraryScreenState();
}

class _VideoLibraryScreenState extends State<VideoLibraryScreen> {
  String _viewMode = 'grid';
  String _sortBy = 'title';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<MediaProvider>(
        builder: (context, provider, child) {
          final videoFiles = provider.videoFiles;

          if (videoFiles.isEmpty) {
            return _buildEmptyState(context, provider);
          }

          return Column(
            children: [
              _buildHeader(context, provider),
              _buildSortOptions(),
              Expanded(
                child: _viewMode == 'list'
                    ? _buildListView(videoFiles, provider)
                    : _buildGridView(videoFiles, provider),
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
            Icons.videocam_off,
            size: 80,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'No video files found',
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
              '${provider.videoFiles.length} videos',
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
                delegate: VideoSearchDelegate(provider),
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
          _buildSortChip('Title', 'title'),
          const SizedBox(width: 8),
          _buildSortChip('Duration', 'duration'),
          const SizedBox(width: 8),
          _buildSortChip('Date Added', 'dateAdded'),
        ],
      ),
    );
  }

  Widget _buildSortChip(String label, String value) {
    final isSelected = _sortBy == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _sortBy = value;
        });
      },
    );
  }

  Widget _buildListView(List<MediaItem> videos, MediaProvider provider) {
    final sortedVideos = _getSortedVideos(videos);

    return ListView.builder(
      itemCount: sortedVideos.length,
      itemBuilder: (context, index) {
        final item = sortedVideos[index];

        return ListTile(
          leading: Container(
            width: 80,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                const Icon(Icons.movie, color: Colors.grey),
                Positioned(
                  right: 4,
                  bottom: 4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 4, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      item.formattedDuration,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          title: Text(
            item.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          subtitle: Text(
            item.artist,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          trailing: PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, size: 20),
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'play',
                child: Text('Play'),
              ),
              const PopupMenuItem(
                value: 'favorite',
                child: Text('Add to Favorites'),
              ),
            ],
            onSelected: (value) {
              if (value == 'play') {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => EnhancedVideoPlayerScreen(video: item),
                  ),
                );
              } else if (value == 'favorite') {
                provider.toggleFavorite(item);
              }
            },
          ),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => EnhancedVideoPlayerScreen(video: item),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildGridView(List<MediaItem> videos, MediaProvider provider) {
    final sortedVideos = _getSortedVideos(videos);

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: sortedVideos.length,
      itemBuilder: (context, index) {
        final item = sortedVideos[index];

        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => EnhancedVideoPlayerScreen(video: item),
              ),
            );
          },
          child: Container(
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              Colors.grey[400]!,
                              Colors.grey[600]!,
                            ],
                          ),
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(12),
                            topRight: Radius.circular(12),
                          ),
                        ),
                      ),
                      const Icon(Icons.movie, size: 48, color: Colors.white70),
                      Positioned(
                        right: 8,
                        bottom: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.7),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            item.formattedDuration,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.artist,
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
              ],
            ),
          ),
        );
      },
    );
  }

  List<MediaItem> _getSortedVideos(List<MediaItem> videos) {
    final sorted = List<MediaItem>.from(videos);
    switch (_sortBy) {
      case 'title':
        sorted.sort((a, b) => a.title.compareTo(b.title));
        break;
      case 'duration':
        sorted.sort((a, b) => b.duration.compareTo(a.duration));
        break;
      case 'dateAdded':
        sorted.sort((a, b) => b.dateAdded.compareTo(a.dateAdded));
        break;
    }
    return sorted;
  }
}

class VideoSearchDelegate extends SearchDelegate<String> {
  final MediaProvider provider;

  VideoSearchDelegate(this.provider);

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
    final results = provider.videoFiles.where((item) {
      final queryLower = query.toLowerCase();
      return item.title.toLowerCase().contains(queryLower) ||
          item.artist.toLowerCase().contains(queryLower);
    }).toList();

    return ListView.builder(
      itemCount: results.length,
      itemBuilder: (context, index) {
        final item = results[index];
        return ListTile(
          leading: const Icon(Icons.movie),
          title: Text(item.title),
          subtitle: Text(item.artist),
          trailing: Text(item.formattedDuration),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => EnhancedVideoPlayerScreen(video: item),
              ),
            );
          },
        );
      },
    );
  }
}
