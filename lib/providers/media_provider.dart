import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/services.dart';

class MediaProvider extends ChangeNotifier {
  final AudioPlayerService _audioPlayer = AudioPlayerService();
  final StorageService _storage = StorageService();
  final MediaScannerService _scanner = MediaScannerService();
  late final AudioEffectsService _audioEffects;
  late final SleepTimerService _sleepTimer;

  List<MediaItem> _allMedia = [];
  List<Playlist> _playlists = [];
  List<String> _recentlyPlayedIds = [];
  List<String> _favoriteIds = [];
  bool _isLoading = false;
  String _searchQuery = '';
  MediaView _currentView = MediaView.all;

  AudioPlayerService get audioPlayer => _audioPlayer;
  StorageService get storage => _storage;
  MediaScannerService get scanner => _scanner;
  AudioEffectsService get audioEffects => _audioEffects;
  SleepTimerService get sleepTimer => _sleepTimer;

  void refresh() {
    notifyListeners();
  }

  List<MediaItem> get allMedia => _allMedia;
  List<Playlist> get playlists => _playlists;
  List<String> get recentlyPlayedIds => _recentlyPlayedIds;
  List<String> get favoriteIds => _favoriteIds;
  bool get isLoading => _isLoading;
  String get searchQuery => _searchQuery;
  MediaView get currentView => _currentView;

  List<MediaItem> get audioFiles =>
      _allMedia.where((m) => m.type == MediaType.audio).toList();

  List<MediaItem> get videoFiles =>
      _allMedia.where((m) => m.type == MediaType.video).toList();

  List<MediaItem> get favorites =>
      _allMedia.where((m) => _favoriteIds.contains(m.id)).toList();

  List<MediaItem> get recentlyPlayed => _recentlyPlayedIds
      .map((id) => _allMedia.firstWhere(
            (m) => m.id == id,
            orElse: () => MediaItem(
              id: '',
              title: '',
              artist: '',
              album: '',
              path: '',
              duration: Duration.zero,
              type: MediaType.audio,
              dateAdded: DateTime.now(),
            ),
          ))
      .where((m) => m.id.isNotEmpty)
      .toList();

  List<MediaItem> get filteredMedia {
    var items = _allMedia;

    switch (_currentView) {
      case MediaView.all:
        break;
      case MediaView.audio:
        items = audioFiles;
        break;
      case MediaView.video:
        items = videoFiles;
        break;
      case MediaView.favorites:
        items = favorites;
        break;
      case MediaView.recentlyPlayed:
        items = recentlyPlayed;
        break;
      case MediaView.playlists:
        items = [];
        break;
    }

    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      items = items.where((m) {
        return m.title.toLowerCase().contains(query) ||
            m.artist.toLowerCase().contains(query) ||
            m.album.toLowerCase().contains(query);
      }).toList();
    }

    return items;
  }

  List<MediaItem> get sortedByTitle {
    final items = List<MediaItem>.from(filteredMedia);
    items.sort((a, b) => a.title.compareTo(b.title));
    return items;
  }

  List<MediaItem> get sortedByArtist {
    final items = List<MediaItem>.from(filteredMedia);
    items.sort((a, b) {
      final artistCompare = a.artist.compareTo(b.artist);
      if (artistCompare != 0) return artistCompare;
      return a.title.compareTo(b.title);
    });
    return items;
  }

  List<MediaItem> get sortedByDateAdded {
    final items = List<MediaItem>.from(filteredMedia);
    items.sort((a, b) => b.dateAdded.compareTo(a.dateAdded));
    return items;
  }

  List<MediaItem> get sortedByDuration {
    final items = List<MediaItem>.from(filteredMedia);
    items.sort((a, b) => b.duration.compareTo(a.duration));
    return items;
  }

  Map<String, List<MediaItem>> get groupedByArtist {
    final groups = <String, List<MediaItem>>{};
    for (final media in audioFiles) {
      groups.putIfAbsent(media.artist, () => []).add(media);
    }
    return groups;
  }

  Map<String, List<MediaItem>> get groupedByAlbum {
    final groups = <String, List<MediaItem>>{};
    for (final media in audioFiles) {
      groups.putIfAbsent(media.album, () => []).add(media);
    }
    return groups;
  }

  Future<void> init() async {
    await _audioPlayer.init();
    _audioEffects = AudioEffectsService(_audioPlayer.player);
    _sleepTimer = SleepTimerService(_audioPlayer.player);
    await _loadPlaylists();
    await _loadFavorites();
    await _loadRecentlyPlayed();
    notifyListeners();
  }

  Future<void> scanMedia() async {
    _isLoading = true;
    notifyListeners();

    final media = await _scanner.scanDeviceMedia();
    _allMedia = media;

    _isLoading = false;
    notifyListeners();
  }

  Future<void> addMediaFiles() async {
    final files = await _scanner.pickFiles();
    if (files.isNotEmpty) {
      _allMedia.addAll(files);
      notifyListeners();
    }
  }

  Future<void> addMediaDirectory() async {
    final files = await _scanner.pickDirectory();
    if (files.isNotEmpty) {
      _allMedia.addAll(files);
      notifyListeners();
    }
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void setView(MediaView view) {
    _currentView = view;
    notifyListeners();
  }

  Future<void> playMedia(MediaItem item, {List<MediaItem>? queue}) async {
    await _audioPlayer.play(item, queue: queue);
    await _storage.addToRecentlyPlayed(item.id);
    await _loadRecentlyPlayed();
    notifyListeners();
  }

  Future<void> toggleFavorite(MediaItem item) async {
    await _storage.toggleFavorite(item.id);
    await _loadFavorites();

    final index = _allMedia.indexWhere((m) => m.id == item.id);
    if (index != -1) {
      _allMedia[index] = item.copyWith(isFavorite: !_allMedia[index].isFavorite);
    }

    notifyListeners();
  }

  Future<void> createPlaylist(String name, {String? description}) async {
    final playlist = Playlist(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: name,
      description: description,
    );
    _playlists.add(playlist);
    await _storage.savePlaylists(_playlists);
    notifyListeners();
  }

  Future<void> deletePlaylist(String playlistId) async {
    _playlists.removeWhere((p) => p.id == playlistId);
    await _storage.savePlaylists(_playlists);
    notifyListeners();
  }

  Future<void> renamePlaylist(String playlistId, String newName) async {
    final index = _playlists.indexWhere((p) => p.id == playlistId);
    if (index != -1) {
      _playlists[index] = _playlists[index].copyWith(name: newName);
      await _storage.savePlaylists(_playlists);
      notifyListeners();
    }
  }

  Future<void> addToPlaylist(String playlistId, MediaItem item) async {
    final index = _playlists.indexWhere((p) => p.id == playlistId);
    if (index != -1) {
      _playlists[index].addItem(item);
      await _storage.savePlaylists(_playlists);
      notifyListeners();
    }
  }

  Future<void> removeFromPlaylist(String playlistId, String itemId) async {
    final index = _playlists.indexWhere((p) => p.id == playlistId);
    if (index != -1) {
      _playlists[index].removeItem(itemId);
      await _storage.savePlaylists(_playlists);
      notifyListeners();
    }
  }

  Future<void> playPlaylist(Playlist playlist) async {
    if (playlist.items.isNotEmpty) {
      await _audioPlayer.playQueue(playlist.items);
    }
  }

  Future<void> _loadPlaylists() async {
    _playlists = await _storage.getPlaylists();
  }

  Future<void> _loadFavorites() async {
    _favoriteIds = await _storage.getFavorites();
  }

  Future<void> _loadRecentlyPlayed() async {
    _recentlyPlayedIds = await _storage.getRecentlyPlayed();
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    super.dispose();
  }
}

enum MediaView {
  all,
  audio,
  video,
  favorites,
  recentlyPlayed,
  playlists,
}
