import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:just_audio/just_audio.dart';
import '../providers/media_provider.dart';
import '../services/audio_player_service.dart';

class NowPlayingScreen extends StatelessWidget {
  const NowPlayingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<MediaProvider>(
        builder: (context, provider, child) {
          final audioPlayer = provider.audioPlayer;
          final currentMedia = audioPlayer.currentMediaItem;

          if (currentMedia == null) {
            return const Center(
              child: Text(
                'No track playing',
                style: TextStyle(fontSize: 18, color: Colors.grey),
              ),
            );
          }

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      const SizedBox(height: 40),
                      _buildAlbumArt(context, currentMedia),
                      const SizedBox(height: 32),
                      _buildTrackInfo(currentMedia),
                      const SizedBox(height: 24),
                      _buildProgressBar(context, audioPlayer),
                      const SizedBox(height: 16),
                      _buildControls(context, audioPlayer),
                      const SizedBox(height: 24),
                      _buildExtraControls(context, audioPlayer, provider),
                    ],
                  ),
                ),
              ),
              _buildQueueSection(context, provider),
            ],
          );
        },
      ),
    );
  }

  Widget _buildAlbumArt(BuildContext context, dynamic media) {
    return Container(
      width: 280,
      height: 280,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Theme.of(context).colorScheme.primary,
            Theme.of(context).colorScheme.secondary,
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Icon(
        Icons.music_note,
        size: 100,
        color: Colors.white.withOpacity(0.8),
      ),
    );
  }

  Widget _buildTrackInfo(dynamic media) {
    return Column(
      children: [
        Text(
          media.title,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 8),
        Text(
          '${media.artist} • ${media.album}',
          style: TextStyle(
            fontSize: 16,
            color: Colors.grey[600],
          ),
          textAlign: TextAlign.center,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildProgressBar(BuildContext context, audioPlayer) {
    return StreamBuilder<Duration>(
      stream: audioPlayer.player.positionStream,
      builder: (context, positionSnapshot) {
        final position = positionSnapshot.data ?? Duration.zero;
        return StreamBuilder<Duration>(
          stream: audioPlayer.player.durationStream,
          builder: (context, durationSnapshot) {
            final duration = durationSnapshot.data ?? Duration.zero;
            return Column(
              children: [
                SliderTheme(
                  data: SliderThemeData(
                    trackHeight: 4,
                    thumbShape:
                        const RoundSliderThumbShape(enabledThumbRadius: 6),
                    overlayShape:
                        const RoundSliderOverlayShape(overlayRadius: 12),
                    activeTrackColor: Theme.of(context).colorScheme.primary,
                    inactiveTrackColor: Colors.grey[300],
                    thumbColor: Theme.of(context).colorScheme.primary,
                    overlayColor:
                        Theme.of(context).colorScheme.primary.withOpacity(0.2),
                  ),
                  child: Slider(
                    value: position.inMilliseconds.toDouble(),
                    max: duration.inMilliseconds.toDouble().clamp(
                          1,
                          double.infinity,
                        ),
                    onChanged: (value) {
                      audioPlayer.seek(Duration(milliseconds: value.toInt()));
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(_formatDuration(position)),
                      Text(_formatDuration(duration)),
                    ],
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildControls(BuildContext context, audioPlayer) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        StreamBuilder<bool>(
          stream: audioPlayer.player.playingStream,
          builder: (context, snapshot) {
            return IconButton(
              icon: const Icon(Icons.skip_previous, size: 40),
              onPressed: () => audioPlayer.previous(),
            );
          },
        ),
        StreamBuilder<bool>(
          stream: audioPlayer.player.playingStream,
          builder: (context, snapshot) {
            final isPlaying = snapshot.data ?? false;
            return Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Theme.of(context).colorScheme.primary,
              ),
              child: IconButton(
                icon: Icon(
                  isPlaying ? Icons.pause : Icons.play_arrow,
                  size: 40,
                  color: Colors.white,
                ),
                onPressed: () => audioPlayer.togglePlayPause(),
              ),
            );
          },
        ),
        IconButton(
          icon: const Icon(Icons.skip_next, size: 40),
          onPressed: () => audioPlayer.next(),
        ),
      ],
    );
  }

  Widget _buildExtraControls(
      BuildContext context, AudioPlayerService audioPlayer, MediaProvider provider) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        IconButton(
          icon: Icon(
            audioPlayer.isShuffled ? Icons.shuffle_on : Icons.shuffle,
            color: audioPlayer.isShuffled
                ? Theme.of(context).colorScheme.primary
                : null,
          ),
          onPressed: () {
            audioPlayer.toggleShuffle();
            _notifyProvider(context);
          },
        ),
        StreamBuilder<SequenceState?>(
          stream: audioPlayer.player.sequenceStateStream,
          builder: (context, snapshot) {
            return IconButton(
              icon: Icon(
                audioPlayer.repeatMode == RepeatMode.off
                    ? Icons.repeat
                    : audioPlayer.repeatMode == RepeatMode.all
                        ? Icons.repeat
                        : Icons.repeat_one,
                color: audioPlayer.repeatMode != RepeatMode.off
                    ? Theme.of(context).colorScheme.primary
                    : null,
              ),
              onPressed: () {
                audioPlayer.cycleRepeatMode();
                _notifyProvider(context);
              },
            );
          },
        ),
        IconButton(
          icon: const Icon(Icons.playlist_play),
          onPressed: () {
            _showQueueBottomSheet(context, provider);
          },
        ),
      ],
    );
  }

  void _notifyProvider(BuildContext context) {
    final provider = Provider.of<MediaProvider>(context, listen: false);
    provider.refresh();
  }

  Widget _buildQueueSection(BuildContext context, MediaProvider provider) {
    return Container(
      height: 100,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Queue',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                Text(
                  '${provider.audioPlayer.queue.length} tracks',
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: provider.audioPlayer.queue.length,
              itemBuilder: (context, index) {
                final item = provider.audioPlayer.queue[index];
                final isCurrent =
                    index == provider.audioPlayer.currentIndex;
                return GestureDetector(
                  onTap: () {
                    provider.audioPlayer.playQueue(
                      provider.audioPlayer.queue,
                      startIndex: index,
                    );
                  },
                  child: Container(
                    width: 150,
                    margin: const EdgeInsets.only(right: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isCurrent
                          ? Theme.of(context)
                              .colorScheme
                              .primary
                              .withOpacity(0.2)
                          : Colors.grey[100],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.music_note,
                          color: isCurrent
                              ? Theme.of(context).colorScheme.primary
                              : Colors.grey,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          item.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontWeight:
                                isCurrent ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
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
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showQueueBottomSheet(BuildContext context, MediaProvider provider) {
    showModalBottomSheet(
      context: context,
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
                        'Play Queue',
                        style: TextStyle(
                            fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      TextButton(
                        onPressed: () {
                          provider.audioPlayer.clearQueue();
                          _notifyProvider(context);
                          Navigator.pop(context);
                        },
                        child: const Text('Clear'),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    controller: scrollController,
                    itemCount: provider.audioPlayer.queue.length,
                    itemBuilder: (context, index) {
                      final item = provider.audioPlayer.queue[index];
                      final isCurrent =
                          index == provider.audioPlayer.currentIndex;
                      return ListTile(
                        leading: Icon(
                          Icons.music_note,
                          color: isCurrent
                              ? Theme.of(context).colorScheme.primary
                              : null,
                        ),
                        title: Text(
                          item.title,
                          style: TextStyle(
                            fontWeight:
                                isCurrent ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                        subtitle: Text(item.artist),
                        trailing: Text(item.formattedDuration),
                        onTap: () {
                          provider.audioPlayer.playQueue(
                            provider.audioPlayer.queue,
                            startIndex: index,
                          );
                          Navigator.pop(context);
                        },
                        onLongPress: () {
                          provider.audioPlayer.removeFromQueue(index);
                          _notifyProvider(context);
                        },
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

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes;
    final seconds = d.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
}
