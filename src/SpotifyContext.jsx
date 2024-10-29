// SpotifyContext.js
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const SpotifyContext = createContext();

const client_id = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const client_secret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

export const SpotifyProvider = ({ children }) => {
    const location = useLocation();
    const playerRef = useRef(null);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [paused, setPaused] = useState(true);
    const [trackProgress, setTrackProgress] = useState(0);
    const [trackDuration, setTrackDuration] = useState(0);
    const [currentVolume, setCurrentVolume] = useState(50);
    const [playerConnected, setPlayerConnected] = useState(false);
    const [spotifyAccessToken, setSpotifyAccessToken] = useState(localStorage.getItem('spotify_access_token'));
    const [randomPlayerName, setRandomPlayerName] = useState('');

    useEffect(() => {
        if (!spotifyAccessToken && location.pathname !== '/spotify' && location.pathname !== '/login') {
            // Redirect to Spotify login if no access token is found
            window.location.href = `http://localhost:8675/login`;
        }
    }, [location.pathname, spotifyAccessToken]);

    useEffect(() => {
        if (playerRef.current) return; // Prevent re-creating the player

        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;

        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            let randomString = "";
            const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (let i = 0; i < 16; i++) {
                randomString += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            setRandomPlayerName(randomString);
            const player = new window.Spotify.Player({
                name: randomString,
                getOAuthToken: cb => { cb(spotifyAccessToken); },
                volume: 0.5
            });

            playerRef.current = player;

            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
                setPlayerConnected(true);
            });

            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
                setPlayerConnected(false);
            });

            player.addListener('player_state_changed', state => {
                console.log('Player state changed', state);
                if (state) {
                    setCurrentTrack(state.track_window.current_track);
                    setPaused(state.paused);
                    setTrackProgress(state.position);
                    setTrackDuration(state.duration);
                }
            });

            player.connect().catch(error => {
                console.error('Failed to connect player:', error);
            });
        };

        return () => {
            if (playerRef.current) {
                playerRef.current.removeListener('ready');
                playerRef.current.removeListener('not_ready');
                playerRef.current.removeListener('player_state_changed');
                playerRef.current.disconnect();
            }
        };
    }, [spotifyAccessToken]);

    const isAuthorized = () => {
        return spotifyAccessToken !== null;
    };


    const refreshSpotifyToken = async () => {
        const refreshToken = localStorage.getItem('spotify_refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(`${client_id}:${client_secret}`)
            },
            body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
            })
        });

        if (!response.ok) {
            // Delete the tokens
            localStorage.removeItem('spotify_access_token');
            localStorage.removeItem('spotify_refresh_token');
            throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        setSpotifyAccessToken(data.access_token);
        localStorage.setItem('spotify_access_token', data.access_token);
        return data.access_token;
    };


    const apiCallWithTokenRefresh = async (apiCall) => {
        try {
            return await apiCall(spotifyAccessToken);
        } catch (error) {
            if (error.status === 401) { // Check for status directly on the error object
                try {
                    const newToken = await refreshSpotifyToken();
                    return await apiCall(newToken);
                } catch (refreshError) {
                    console.error('Error refreshing token:', refreshError);
                    throw refreshError;
                }
            } else {
                console.error('API call error:', error);
                throw error;
            }
        }
    };

    const getUserProfile = async (token) => {
        const response = await fetch('https://api.spotify.com/v1/me', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
            },
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        }
        else {
            const error = new Error('Failed to fetch user profile');
            error.status = response.status;
            throw error;
        }
    };

    const getUserTopItems = async (token, type) => {
        const response = await fetch(`https://api.spotify.com/v1/me/top/${type}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
            },
        });
        if (response.ok) {
            const data = await response.json();
            console.log(`Top ${type}`, data.items);
            return data.items;
        }
        else {
            const error = new Error('Failed to fetch user top items');
            error.status = response.status;
            throw error;
        }
    };

    const getUserFollowedArtists = async (token) => {
        console.log('Getting followed artists');
        const response = await fetch('https://api.spotify.com/v1/me/following?type=artist', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        if (response.ok) {
            const data = await response.json();
            console.log('Followed artists:', data.artists.items);
            return data.artists.items;
        } else {
            const error = new Error('Failed to fetch followed artists');
            error.status = response.status; // Attach status to the error object
            throw error;
        }
    };

    // Web SDK Functions

    // function to play a certain song, accepts an array and will pass the array,
    const playSong = async (token, songArray) => {
        const response = await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + spotifyAccessToken,
            },
            body: JSON.stringify({
                uris: songArray,
            }),
        });
        if (response.ok) {
            console.log('Playing song');
        } else {
            const error = new Error('Failed to play song');
            error.status = response.status;
            throw error;
        }
    }

    const getArtist = async (token, id) => {
        const response = await fetch('https://api.spotify.com/v1/artists/' + id, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            const error = new Error('Failed to fetch artist');
            error.status = response.status;
            throw error;
        }
    };

    const getArtistAlbums = async (token, id) => {
        const response = await fetch('https://api.spotify.com/v1/artists/' + id + '/albums', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        if (response.ok) {
            const data = await response.json();
            return data.items;
        } else {
            const error = new Error('Failed to fetch artist albums');
            error.status = response.status;
            throw error;
        }
    };

    const getArtistTopTracks = async (token, id) => {
        const response = await fetch(`https://api.spotify.com/v1/artists/${id}/top-tracks`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        if (response.ok) {
            const data = await response.json();
            return data.tracks;
        } else {
            const error = new Error('Failed to fetch artist top tracks');
            error.status = response.status;
            throw error;
        }
    };

    const getRelatedArtists = async (token, id) => {
        const response = await fetch(`https://api.spotify.com/v1/artists/${id}/related-artists`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        if (response.ok) {
            const data = await response.json();
            return data.artists;
        } else {
            const error = new Error('Failed to fetch related artists');
            error.status = response.status;
            throw error;
        }
    };

    const getAlbum = async (token, id) => {
        const response = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            const error = new Error('Failed to fetch album');
            error.status = response.status;
            throw error;
        }
    };

    const getUserPlaylists = async (token) => {
        const response = await fetch('https://api.spotify.com/v1/me/playlists', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
            },
        });
        if (response.ok) {
            const data = await response.json();
            return data.items;
        } else {
            const error = new Error('Failed to fetch user playlists');
            error.status = response.status;
            throw error;
        }
    };

    const getUserAlbums = async (token) => {
        const response = await fetch('https://api.spotify.com/v1/me/albums', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
            },
        });
        if (response.ok) {
            const data = await response.json();
            return data.items;
        } else {
            const error = new Error('Failed to fetch user albums');
            error.status = response.status;
            throw error;
        }
    };

    const getPlaylist = async (token, id) => {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            const error = new Error('Failed to fetch playlist');
            error.status = response.status;
            throw error;
        }
    };

    const searchSpotify = async (token, query, type) => {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            const error = new Error('Failed to search Spotify');
            error.status = response.status;
            throw error;
        }
    };

    return (
        <SpotifyContext.Provider value={{
            player: playerRef.current,
            currentTrack,
            paused,
            trackProgress,
            trackDuration,
            currentVolume,
            playerConnected,
            spotifyAccessToken,
            randomPlayerName,
            setPaused,
            setTrackProgress,
            setTrackDuration,
            setCurrentVolume,
            apiCallWithTokenRefresh,
            getUserFollowedArtists,
            getUserPlaylists,
            getUserAlbums,
            getArtist,
            getArtistAlbums,
            getArtistTopTracks,
            getUserProfile,
            getRelatedArtists,
            getAlbum,
            getPlaylist,
            getUserTopItems,
            searchSpotify,
            isAuthorized,
            playSong
        }}>
            {children}
        </SpotifyContext.Provider>
    );
};

export const useSpotify = () => useContext(SpotifyContext);