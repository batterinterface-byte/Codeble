import 'package:flutter/material.dart';
import '../models/models.dart';

class MediaListTile extends StatelessWidget {
  final MediaItem item;
  final bool isPlaying;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final VoidCallback? onPlay;
  final VoidCallback? onFavorite;
  final VoidCallback? onAddToPlaylist;
  final VoidCallback? onDelete;

  const MediaListTile({
    super.key,
    required this.item,
    this.isPlaying = false,
    this.onTap,
    this.onLongPress,
    this.onPlay,
    this.onFavorite,
    this.onAddToPlaylist,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
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
          _getMediaIcon(),
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
              PopupMenuItem(
                value: 'play',
                child: Row(
                  children: [
                    const Icon(Icons.play_arrow, size: 20),
                    const SizedBox(width: 8),
                    const Text('Play'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'favorite',
                child: Row(
                  children: [
                    Icon(
                      item.isFavorite ? Icons.favorite : Icons.favorite_border,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(item.isFavorite
                        ? 'Remove from Favorites'
                        : 'Add to Favorites'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'playlist',
                child: Row(
                  children: [
                    Icon(Icons.playlist_add, size: 20),
                    SizedBox(width: 8),
                    Text('Add to Playlist'),
                  ],
                ),
              ),
              if (onDelete != null)
                const PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete, size: 20, color: Colors.red),
                      SizedBox(width: 8),
                      Text('Delete', style: TextStyle(color: Colors.red)),
                    ],
                  ),
                ),
            ],
            onSelected: (value) {
              _handleMenuAction(value);
            },
          ),
        ],
      ),
      onTap: onTap,
      onLongPress: onLongPress,
    );
  }

  IconData _getMediaIcon() {
    switch (item.type) {
      case MediaType.audio:
        return Icons.music_note;
      case MediaType.video:
        return Icons.video_library;
    }
  }

  void _handleMenuAction(String action) {
    switch (action) {
      case 'play':
        onPlay?.call();
        break;
      case 'favorite':
        onFavorite?.call();
        break;
      case 'playlist':
        onAddToPlaylist?.call();
        break;
      case 'delete':
        onDelete?.call();
        break;
    }
  }
}
