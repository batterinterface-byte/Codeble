import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lottie/lottie.dart';
import 'package:just_audio/just_audio.dart';
import '../providers/media_provider.dart';
import '../services/audio_player_service.dart';
import 'equalizer_screen.dart';
import 'sleep_timer_dialog.dart';
import 'queue_screen.dart';

class EnhancedNowPlayingScreen extends StatefulWidget {
  const EnhancedNowPlayingScreen({super.key});

  @override
  State<EnhancedNowPlayingScreen> createState() => _EnhancedNowPlayingScreenState();
}

class _EnhancedNowPlayingScreenState extends State<EnhancedNowPlayingScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  bool _showLottie = true;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

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
                      _buildAlbumArt(context, provider),
                      const SizedBox(height: 32),
                      _buildTrackInfo(currentMedia),
                      const SizedBox(height: 24),
                      _buildProgressBar(context, audioPlayer),
                      const SizedBox(height: 16),
                      _buildControls(context, audioPlayer, provider),
                      const SizedBox(height: 24),
                      _buildExtraControls(context, audioPlayer, provider),
                    ],
                  ),
                ),
              ),
              _buildBottomActions(context, provider),
            ],
          );
        },
      ),
    );
  }

  Widget _buildAlbumArt(BuildContext context, MediaProvider provider) {
    return GestureDetector(
      onTap: () {
        setState(() => _showLottie = !_showLottie);
      },
      child: Container(
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
        child: _showLottie
            ? Stack(
                alignment: Alignment.center,
                children: [
                  Lottie.asset(
                    'assets/animations/animation.json',
                    width: 200,
                    height: 200,
                    fit: BoxFit.contain,
                  ),
                  Positioned(
                    bottom: 16,
                    child: Text(
                      'Tap to toggle animation',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.7),
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              )
            : const Icon(
                Icons.music_note,
                size: 100,
                color: Colors.white,
              ),
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
                    thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                    overlayShape: const RoundSliderOverlayShape(overlayRadius: 12),
                    activeTrackColor: Theme.of(context).colorScheme.primary,
                    inactiveTrackColor: Colors.grey[300],
                    thumbColor: Theme.of(context).colorScheme.primary,
                    overlayColor: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                  ),
                  child: Slider(
                    value: position.inMilliseconds.toDouble(),
                    max: duration.inMilliseconds.toDouble().clamp(1, double.infinity),
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

  Widget _buildControls(
    BuildContext context,
    AudioPlayerService audioPlayer,
    MediaProvider provider,
  ) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        IconButton(
          icon: const Icon(Icons.skip_previous, size: 40),
          onPressed: () => audioPlayer.previous(),
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
    BuildContext context,
    AudioPlayerService audioPlayer,
    MediaProvider provider,
  ) {
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
            provider.refresh();
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
                provider.refresh();
              },
            );
          },
        ),
        PopupMenuButton<double>(
          icon: const Icon(Icons.speed),
          tooltip: 'Playback Speed',
          itemBuilder: (context) => [
            _buildSpeedItem(0.5, provider),
            _buildSpeedItem(0.75, provider),
            _buildSpeedItem(1.0, provider),
            _buildSpeedItem(1.25, provider),
            _buildSpeedItem(1.5, provider),
            _buildSpeedItem(2.0, provider),
          ],
          onSelected: (speed) => audioPlayer.setSpeed(speed),
        ),
      ],
    );
  }

  Widget _buildBottomActions(BuildContext context, MediaProvider provider) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _buildBottomAction(
              icon: Icons.queue_music,
              label: 'Queue',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const QueueScreen(),
                  ),
                );
              },
            ),
            _buildBottomAction(
              icon: Icons.equalizer,
              label: 'EQ',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const EqualizerScreen(),
                  ),
                );
              },
            ),
            _buildBottomAction(
              icon: Icons.timer,
              label: 'Sleep',
              onTap: () {
                showDialog(
                  context: context,
                  builder: (context) => const SleepTimerDialog(),
                );
              },
            ),
            _buildBottomAction(
              icon: Icons.playlist_play,
              label: 'Playlist',
              onTap: () {
                _showAddToPlaylistDialog(context, provider);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomAction({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 24),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }

  void _showAddToPlaylistDialog(BuildContext context, MediaProvider provider) {
    final currentMedia = provider.audioPlayer.currentMediaItem;
    if (currentMedia == null) return;

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
                    provider.addToPlaylist(playlist.id, currentMedia);
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Added to ${playlist.name}')),
                    );
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

  PopupMenuItem<double> _buildSpeedItem(double speed, MediaProvider provider) {
    return PopupMenuItem(
      value: speed,
      child: Row(
        children: [
          if (provider.audioPlayer.player.speed == speed)
            const Icon(Icons.check, color: Colors.blue, size: 20),
          const SizedBox(width: 8),
          Text('${speed}x'),
        ],
      ),
    );
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes;
    final seconds = d.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
}
