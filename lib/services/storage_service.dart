import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

class StorageService {
  static const String _favoritesKey = 'favorites';
  static const String _playlistsKey = 'playlists';
  static const String _recentlyPlayedKey = 'recently_played';
  static const String _playbackPositionKey = 'playback_position';
  static const String _settingsKey = 'settings';

  Future<List<String>> getFavorites() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getStringList(_favoritesKey);
    return data ?? [];
  }

  Future<void> setFavorites(List<String> itemIds) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_favoritesKey, itemIds);
  }

  Future<void> toggleFavorite(String itemId) async {
    final favorites = await getFavorites();
    if (favorites.contains(itemId)) {
      favorites.remove(itemId);
    } else {
      favorites.add(itemId);
    }
    await setFavorites(favorites);
  }

  Future<bool> isFavorite(String itemId) async {
    final favorites = await getFavorites();
    return favorites.contains(itemId);
  }

  Future<List<Playlist>> getPlaylists() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getStringList(_playlistsKey);
    if (data == null) return [];

    return data
        .map((s) => Playlist.fromMap(jsonDecode(s) as Map<String, dynamic>))
        .toList();
  }

  Future<void> savePlaylists(List<Playlist> playlists) async {
    final prefs = await SharedPreferences.getInstance();
    final data = playlists
        .map((p) => jsonEncode(p.toMap()))
        .toList();
    await prefs.setStringList(_playlistsKey, data);
  }

  Future<void> addPlaylist(Playlist playlist) async {
    final playlists = await getPlaylists();
    playlists.add(playlist);
    await savePlaylists(playlists);
  }

  Future<void> updatePlaylist(Playlist playlist) async {
    final playlists = await getPlaylists();
    final index = playlists.indexWhere((p) => p.id == playlist.id);
    if (index != -1) {
      playlists[index] = playlist;
      await savePlaylists(playlists);
    }
  }

  Future<void> deletePlaylist(String playlistId) async {
    final playlists = await getPlaylists();
    playlists.removeWhere((p) => p.id == playlistId);
    await savePlaylists(playlists);
  }

  Future<List<String>> getRecentlyPlayed() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getStringList(_recentlyPlayedKey);
    return data ?? [];
  }

  Future<void> addToRecentlyPlayed(String itemId) async {
    final recent = await getRecentlyPlayed();
    recent.remove(itemId);
    recent.insert(0, itemId);
    if (recent.length > 50) {
      recent.removeRange(50, recent.length);
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_recentlyPlayedKey, recent);
  }

  Future<void> clearRecentlyPlayed() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_recentlyPlayedKey);
  }

  Future<Duration?> getPlaybackPosition(String mediaId) async {
    final prefs = await SharedPreferences.getInstance();
    final key = '$_playbackPositionKey.$mediaId';
    final position = prefs.getInt(key);
    return position != null ? Duration(milliseconds: position) : null;
  }

  Future<void> savePlaybackPosition(String mediaId, Duration position) async {
    final prefs = await SharedPreferences.getInstance();
    final key = '$_playbackPositionKey.$mediaId';
    await prefs.setInt(key, position.inMilliseconds);
  }

  Future<void> clearPlaybackPosition(String mediaId) async {
    final prefs = await SharedPreferences.getInstance();
    final key = '$_playbackPositionKey.$mediaId';
    await prefs.remove(key);
  }

  Future<Map<String, dynamic>> getSettings() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_settingsKey);
    if (data == null) {
      return {
        'volume': 1.0,
        'speed': 1.0,
        'shuffle': false,
        'repeat': 'off',
        'theme': 'system',
        'sleepTimer': 0,
      };
    }
    return jsonDecode(data) as Map<String, dynamic>;
  }

  Future<void> saveSetting(String key, dynamic value) async {
    final settings = await getSettings();
    settings[key] = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_settingsKey, jsonEncode(settings));
  }

  Future<T?> getSetting<T>(String key) async {
    final settings = await getSettings();
    return settings[key] as T?;
  }
}
