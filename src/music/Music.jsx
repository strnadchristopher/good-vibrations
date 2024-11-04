import { useEffect, useState, useRef } from 'react';
import { Tilt } from 'react-tilt'
import { useParams } from 'react-router-dom';
import './Music.css';
import { useNavigate, NavLink } from 'react-router-dom';
import musicIcon from '../assets/sound.png';
import { faPlay, faShuffle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { useSpotify } from '../SpotifyContext';

export function SpotifyHome() {
    const { apiCallWithTokenRefresh, getUserProfile, getUserTopItems } = useSpotify();
    const [artists, setArtists] = useState([]);
    const [user, setUser] = useState(null);
    const [tracks, setTracks] = useState([]);
    const backgroundImageRef = useRef(null);
    useEffect(() => {
        if (user && user.images && user.images[0]) {
            const img = new Image();
            img.src = user.images[0].url;
            img.onload = () => {
                const width = img.width;
                const height = img.height;
                const collectionArt = document.querySelector('.CollectionArt');
                if (collectionArt) {
                    collectionArt.style.width = `${width}px`;
                    collectionArt.style.height = `${height}px`;
                }
            };
        }
    }, [user]);

    useEffect(() => {
        if (artists && user && tracks) return;
        // Fill the above state with the user's top playlists, albums, and artists and profile, we can call getUserTopItems(type) and getUserProfile()
        apiCallWithTokenRefresh((token) => getUserProfile(token))
            .then(data => {
                console.log("User Profile: ", data);
                setUser(data);
                if (backgroundImageRef.current) return;
                backgroundImageRef.current = data.images[0].url;
            })
            .catch((error) => {
                console.error("Error fetching user profile: ", error);
            });

        apiCallWithTokenRefresh((token) => getUserTopItems(token, "tracks"))
            .then(data => {
                console.log("Top Tracks: ", data);
                setTracks(data);
            })
            .catch((error) => {
                console.error("Error fetching top tracks: ", error);
            });



        apiCallWithTokenRefresh((token) => getUserTopItems(token, "artists"))
            .then(data => {
                console.log("Top Artists: ", data);
                setArtists(data);
            })
            .catch((error) => {
                console.error("Error fetching top artists: ", error);
            });

    }, [
        apiCallWithTokenRefresh,
        getUserProfile,
        getUserTopItems,
        artists,
        user,
        tracks,
    ])

    return (
        <div className="CollectionPage">
            {/* User Profile, similar to collection header in artist explore page */}
            <div className="CollectionContainer">
                {user != null &&
                    <div className="CollectionHeader">
                        <img className="CollectionArt" src={user.images[0].url} alt="User Art" />
                        <div className="CollectionHeaderInfo">
                            <p>{user.display_name}</p>
                            <p>{user.followers.total} Followers</p>
                        </div>
                    </div>
                }
                <div className="CollectionExplorerBody">
                    {/* Top Tracks */}
                    {tracks && <h2>Top Tracks</h2>}
                    {tracks && <div className="TrackList">
                        {tracks.map((track, idx) => {
                            return <TrackItem key={idx} track={track} />
                        })}
                    </div>}

                    {artists && <h2>Top Artists</h2>}
                    {artists && <div className="SpotifyCollection">
                        {artists.map((artist, idx) => {
                            return <ArtistItem key={idx} artist={artist} />
                        })}
                    </div>}
                </div>
            </div>
        </div>
    )

}

export function SpotifyPlaylistBrowser() {
    const [playlists, setPlaylists] = useState([]);
    const { apiCallWithTokenRefresh, getUserPlaylists } = useSpotify();
    const backgroundImageRef = useRef(null);
    // Lists the spotify playlists of the user
    // Catch any error, if it's a 401, we'll call the handle_spotify_error

    useEffect(() => {
        apiCallWithTokenRefresh((token) => getUserPlaylists(token))
            .then(data => {
                console.log("Playlists: ", data);
                setPlaylists(data);
                if (backgroundImageRef.current) return;
                backgroundImageRef.current = data[Math.floor(Math.random() * data.length)].images[0].url;
            })
            .catch((error) => {
                console.error("Error fetching playlists: ", error);
            });

    }, [
        apiCallWithTokenRefresh,
        getUserPlaylists
    ])

    return (
        <div className="MusicPage"
        >
            {/* Background image overlay that will be blurred, and set to a random playlist's image */}
            <div className="SpotifyCollectionBackgroundImage">
                {playlists.length > 0 && <img src={backgroundImageRef.current} alt="Playlist Background" />}
            </div>
            <h1>Your Playlists</h1>
            {playlists != null &&
                playlists.map((playlist, idx) => {
                    return <PlaylistItem key={idx} playlist={playlist} />
                })
            }
        </div>
    )
}

export function PlaylistExplorer() {
    // Use params to get the playlist id
    let { playlist_id } = useParams();
    const [playlist, setPlaylist] = useState(null);
    const { apiCallWithTokenRefresh, getPlaylist, playSong } = useSpotify();
    const backgroundImageRef = useRef(null);
    useEffect(() => {
        apiCallWithTokenRefresh((token) => getPlaylist(token, playlist_id))
            .then(data => {
                console.log("Playlist: ", data);
                setPlaylist(data);
                if (backgroundImageRef.current) return;
                backgroundImageRef.current = data.images[0].url
            })
            .catch((error) => {
                console.error("Error: ", error);
            });


    }, [
        apiCallWithTokenRefresh,
        getPlaylist,
        playlist_id
    ])

    const playPlaylist = () => {
        if (playlist == null) return;
        let uris = playlist.tracks.items.map((track) => track.track.uri);
        apiCallWithTokenRefresh((token) => playSong(token, uris))
            .then(() => {
                console.log("Playing playlist");
            })
            .catch((error) => {
                console.error("Error playing playlist: ", error);
            });
    }


    const shufflePlaylist = () => {
        if (playlist == null) return;
        let uris = playlist.tracks.items.map((track) => track.track.uri);
        // Shuffle the uri array 

        uris = uris.sort(() => Math.random() - 0.5);

        apiCallWithTokenRefresh((token) => playSong(token, uris))
            .then(() => {
                console.log("Shuffling playlist");
            })
            .catch((error) => {
                console.error("Error shuffling playlist: ", error);
            });
    }

    return (
        <div className="CollectionPage">
            {playlist != null && <>
                <h2 className="CollectionHeaderName">{playlist.name}</h2>
                <div className="CollectionContainer">
                    <div className="CollectionExplorerHeader">
                        <img className="CollectionArt" src={playlist.images[0].url} alt="Playlist Art" />
                        <div className="CollectionHeaderInfo">
                            <p>By {playlist.owner.display_name}</p>
                            <br />
                            <div className="CollectionHeaderButtons">
                                <button
                                    onClick={playPlaylist}
                                ><FontAwesomeIcon icon={faPlay} /></button>
                                <br />
                                <button
                                    onClick={shufflePlaylist}
                                ><FontAwesomeIcon icon={faShuffle} /></button>
                            </div>
                        </div>
                    </div>
                    {playlist.tracks != undefined &&
                        <div className="CollectionExplorerBody">
                            <div className="TrackList">
                                {playlist.tracks.items.map((track, idx) => {
                                    return <TrackItem key={idx} track={track.track} />
                                })}
                            </div>
                        </div>
                    }
                </div>
            </>}
        </div>
    )

}

export function SpotifyAlbumsBrowser() {
    const [albums, setAlbums] = useState([]);
    const { apiCallWithTokenRefresh, getUserAlbums } = useSpotify();
    const backgroundImageRef = useRef(null);
    // Let's get our subscribed albums
    useEffect(() => {
        apiCallWithTokenRefresh((token) => getUserAlbums(token))
            .then(data => {
                console.log("Albums: ", data);
                setAlbums(data);
                if (backgroundImageRef.current) return;
                backgroundImageRef.current = `${data[Math.floor(Math.random() * data.length)].album.images[0].url}`;
            })
            .catch((error) => {
                console.error("Error fetching albums: ", error);
            })

    }, [apiCallWithTokenRefresh, getUserAlbums])

    return (
        <div className="MusicPage">
            <div className="SpotifyCollectionBackgroundImage">
                {albums.length > 0 && <img src={backgroundImageRef.current} alt="Album Background" />}
            </div>
            <h1>Your Albums</h1>
            {albums != null &&
                albums.map((album, idx) => {
                    return <AlbumItem key={idx} album={album.album} />
                })
            }
        </div>
    )
}

export function AlbumExplorer() {
    let { album_id } = useParams();
    const [album, setAlbum] = useState(null);
    const { apiCallWithTokenRefresh, getAlbum, playSong } = useSpotify();
    useEffect(() => {
        apiCallWithTokenRefresh((token) => getAlbum(token, album_id))
            .then(data => {
                console.log("Album: ", data);
                setAlbum(data);
            })
            .catch((error) => {
                console.error("Error: ", error);
            });
    }, [
        apiCallWithTokenRefresh,
        getAlbum,
        album_id
    ])

    const playAlbum = () => {
        if (album == null) return;
        let uris = album.tracks.items.map((track) => track.uri);
        apiCallWithTokenRefresh((token) => playSong(token, uris))
            .then(() => {
                console.log("Playing album");
            })
            .catch((error) => {
                console.error("Error playing album: ", error);
            });
    }

    const shuffleAlbum = () => {
        if (album == null) return;
        let uris = album.tracks.items.map((track) => track.uri);
        // Shuffle the uri array 
        uris = uris.sort(() => Math.random() - 0.5);
        apiCallWithTokenRefresh((token) => playSong(token, uris))
            .then(() => {
                console.log("Shuffling album");
            })
            .catch((error) => {
                console.error("Error shuffling album: ", error);
            });
    }

    return (
        <div className="CollectionPage">
            {album != null && <>
                <h2 className="CollectionHeaderName">{album.name}</h2>
                <div className="CollectionContainer">
                    <div className="CollectionExplorerHeader">
                        <img className="CollectionArt" src={
                            album.images[0].url
                        } alt="Album Art" />
                        <div className="CollectionHeaderInfo">
                            <h2>by {album.artists.map((artist) => artist.name).join(", ")}</h2>
                            <br />
                            {/* Download button */}
                            <div className="CollectionHeaderButtons">
                                <button
                                    onClick={playAlbum}
                                ><FontAwesomeIcon icon={faPlay} /></button>
                                <button
                                    onClick={shuffleAlbum}
                                ><FontAwesomeIcon icon={faShuffle} /></button>
                            </div>
                        </div>

                    </div>
                    {album.tracks != undefined &&
                        <div className="CollectionExplorerBody">
                            <div className="TrackList">
                                {album.tracks.items.map((track, index) => {
                                    return <TrackItem key={index} show_art={false} track={track} album={album} show_artist={false} />
                                })}
                            </div>
                        </div>
                    }

                </div>
            </>}
        </div>
    )
}

export function SubscribedArtistsBrowser() {
    // Shows Related Artists to the user's subscribed artists
    const [artists, setArtists] = useState([]);
    const { apiCallWithTokenRefresh, getUserFollowedArtists } = useSpotify();
    const backgroundImageRef = useRef(null);

    useEffect(() => {
        apiCallWithTokenRefresh((token) => getUserFollowedArtists(token))
            .then(data => {
                console.log("Followed Artists: ", data);
                setArtists(data);

                // Set a random artist's image as the background
                if (data.length > 0) {
                    if (backgroundImageRef.current) return;
                    let artist = data[Math.floor(Math.random() * data.length)];
                    backgroundImageRef.current = artist.images[0].url;
                }
            })
            .catch((error) => {
                console.error("Error fetching followed artists: ", error);
            });
    }, [
        apiCallWithTokenRefresh,
        getUserFollowedArtists
    ])

    return (
        <div className="MusicPage">
            <div className="SpotifyCollectionBackgroundImage">
                {artists.length > 0
                    && <img src={backgroundImageRef.current} alt="Artist Background" />}
            </div>
            <h1>Your Artists</h1>
            {artists != null &&

                artists.map((artist, idx) => {
                    return <ArtistItem key={idx} artist={artist} size={300} />
                })
            }
        </div>
    )
}

export function ArtistExplorer() {
    let { artist_id } = useParams();
    const [artist, setArtist] = useState(null);
    const [artist_top_tracks, setArtistTopTracks] = useState(null);
    const [artist_albums, setArtistAlbums] = useState(null);
    const [related_artists, setRelatedArtists] = useState(null);
    const { apiCallWithTokenRefresh, getArtist, getArtistTopTracks, getArtistAlbums, getRelatedArtists } = useSpotify();
    const [spotifyError, setSpotifyError] = useState(null);

    useEffect(() => {
        apiCallWithTokenRefresh((token) => getArtist(token, artist_id))
            .then(data => {
                console.log("Artist: ", data);
                setArtist(data);
                // Fetch artist's top tracks
                apiCallWithTokenRefresh((token) => getArtistTopTracks(token, artist_id))
                    .then(tracks => {
                        console.log("Artist Top Tracks: ", tracks);
                        setArtistTopTracks(tracks);
                    })
                    .catch((error) => {
                        console.error("Error fetching top tracks: ", error);
                        setSpotifyError(error);
                    });

                // Fetch artist's albums
                apiCallWithTokenRefresh((token) => getArtistAlbums(token, artist_id))
                    .then(albums => {
                        console.log("Artist Albums: ", albums);
                        setArtistAlbums(albums);
                    })
                    .catch((error) => {
                        console.error("Error fetching albums: ", error);
                        setSpotifyError(error);
                    });

                // Fetch related artists
                apiCallWithTokenRefresh((token) => getRelatedArtists(token, artist_id))
                    .then(related => {
                        setRelatedArtists(related);
                        console.log("Related Artists: ", related);
                    })
                    .catch((error) => {
                        console.error("Error fetching related artists: ", error);
                        setSpotifyError(error);
                    });

            })
            .catch((error) => {
                console.error("Error: ", error);
                setSpotifyError(error);
            });
    }, [
        apiCallWithTokenRefresh,
        getArtist,
        getArtistTopTracks,
        getArtistAlbums,
        getRelatedArtists,
        artist_id
    ])




    // Similar to other explorer pages, but we'll show the artist's top tracks as well as their albums, which will be album items
    return (
        <div className="CollectionPage">
            {
                spotifyError != null && <div className="SpotifyError">
                    <h1>Spotify Error</h1>
                    <p>{spotifyError}</p>
                </div>
            }
            {artist != null && <>
                {/* <h1 className="CollectionHeaderName">{artist.name}</h1> */}
                <div className="CollectionContainer">

                    <div className="CollectionExplorerHeader">
                        <h1>{artist.name}</h1>
                        <br />
                        <br />
                        <img className="CollectionArt" src={artist.images[0].url} alt="Artist Background" />
                        <div className="CollectionHeaderInfo">

                            <p>{artist.genres.join(", ")}</p>
                            <br />
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-around',
                                alignItems: 'center'
                            }}><button><FontAwesomeIcon icon={faShuffle} /></button>
                                <button><FontAwesomeIcon icon={faPlay} /></button></div>
                            <br />
                            <br />

                            <h2>Top Tracks</h2>
                            {artist_top_tracks != undefined &&
                                <div className="TrackList">
                                    {artist_top_tracks.map((track, index) => {
                                        return <TrackItem key={index} track={track} show_artist={false} />
                                    })}
                                </div>
                            }
                        </div>
                    </div>
                    <div className="CollectionExplorerBody">
                        {artist_albums != undefined &&
                            <>
                                <h2>Albums</h2>
                                {artist_albums
                                    .filter((album) => album.album_type == "album")
                                    .map((album, index) => {
                                        return <AlbumItem key={index} album={album} show_name={true} size={200} />
                                    })}
                                {artist_albums
                                    .filter((album) => album.album_type == "single").length > 0 && <h2>Singles</h2>}
                                {artist_albums
                                    .filter((album) => album.album_type == "single")
                                    .map((album, index) => {
                                        return <AlbumItem key={index} show_name={true} album={album} size={200} />
                                    })}
                            </>
                        }
                        {related_artists != undefined &&
                            <>
                                <h2>Related Artists</h2>
                                {related_artists.map((artist, index) => {
                                    return <ArtistItem key={index} artist={artist} size={150} />
                                })}
                            </>
                        }
                    </div>
                </div>
            </>}
        </div>
    )
}

export function MusicSearch() {
    // search query is passed in url with useparams
    let { search_query } = useParams();
    const [search_results, setSearchResults] = useState(null);
    const { apiCallWithTokenRefresh, searchSpotify } = useSpotify();
    useEffect(() => {
        apiCallWithTokenRefresh((token) => searchSpotify(token, search_query, "track,album,artist"))
            .then(data => {
                console.log("Search Results: ", data);
                setSearchResults(data);
            })
            .catch((error) => {
                console.error("Error fetching search results: ", error);
            });
    }, [
        apiCallWithTokenRefresh,
        searchSpotify,
        search_query
    ])

    return (
        <div className="SearchResults">
            {search_results != null &&
                <>
                    <h2>Search Results for: {search_query}</h2>
                    <br />
                    <h1>Artists</h1>
                    {search_results.artists.items.map((artist, idx) => {
                        return <ArtistItem key={idx} artist={artist} />
                    })}
                    <br />
                    <br />
                    <h1>Tracks</h1>
                    <br />
                    <div className="TrackList">
                        {search_results.tracks.items.map((track, idx) => {
                            return <TrackItem key={idx} track={track} />
                        })}
                    </div>
                    <br />
                    <br />
                    <h1>Albums</h1>
                    <br />
                    {search_results.albums.items.map((album, idx) => {
                        return <AlbumItem key={idx} album={album} />
                    })}
                </>
            }
        </div>
    )
}

function PlaylistItem({ playlist }) {
    const navigate = useNavigate();
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        const img = new Image();
        img.src = playlist.images[0].url;
        img.onload = () => {
            setImageLoaded(true);
        }
    }, [playlist])
    return (
        <Tilt
            options={{
                maxTilt: 15,
                perspective: 1500,
                easing: "cubic-bezier(.03,.98,.52,.99)",
                speed: 2000,
                maxGlare: 1,
                glare: true,
                scale: 1.02,
                reverse: true
            }}
            // Onclick, navigate to the playlist explorer, at /playlists/:playlist_id
            className="SpotifyCollectionItemTilt PlaylistItemTilt"
            style={{
                backgroundImage: `url(${playlist.images[0].url})`,
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.5s',
            }}
        >
            <div className="SpotifyCollectionItem"
                onClick={() => {
                    console.log("Navigating to: ", `/playlist/${playlist.id}`);
                    navigate(`/playlist/${playlist.id}`)
                }}
            >
                {/* <div className="PlaylistOverlay"></div>
                <img className="PlaylistArt"
                    src={playlist.images[0].url}
                /> */}
                <span className="CollectionName PlaylistName"
                >{playlist.name}</span>
            </div>
        </Tilt>
    )

}

function ArtistItem({ artist }) {
    const navigate = useNavigate();
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        const img = new Image();
        img.src = artist.images[0].url;
        img.onload = () => {
            setImageLoaded(true);
        }
    }, [artist.images])


    return (
        <Tilt
            options={{
                maxTilt: 15,
                perspective: 1500,
                easing: "cubic-bezier(.03,.98,.52,.99)",
                speed: 2000,
                glare: true,
                maxGlare: 1,
                scale: 1.02,
                reverse: true,
            }}
            className="SpotifyCollectionItemTilt"
            style={{
                borderRadius: '1em',         // Ensure it's circular
                overflow: 'hidden',
                transition: 'opacity 0.5s',
                opacity: imageLoaded ? 1 : 0,
            }}
        >
            <div
                className="SpotifyCollectionItem Circle"
                style={{
                    backgroundImage: artist.images?.length > 0 ? `url(${artist.images[0].url})` : `url(${musicIcon})`,
                    backgroundSize: artist.images?.length > 0 ? 'cover' : 'contain',
                }}
                onClick={() => {
                    console.log("Navigating to: ", `/artist/${artist.id}`);
                    navigate(`/artist/${artist.id}`);
                }}
            >
                <span className="CollectionName">{artist.name}</span>
            </div>
        </Tilt>
    );
}

function AlbumItem({ album, show_name = true }) {
    const navigate = useNavigate();
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        const img = new Image();
        img.src = album.images[0].url;
        img.onload = () => {
            setImageLoaded(true);
        }
    }, [album.images])

    // Adjust circle radius and stroke width based on size
    return (
        <Tilt
            options={{
                maxTilt: 15,
                perspective: 1500,
                easing: "cubic-bezier(.03,.98,.52,.99)",
                speed: 2000,
                glare: true,
                maxGlare: 1,
                scale: 1.02,
                reverse: true,
            }}
            className="SpotifyCollectionItemTilt"
            style={{
                borderRadius: '1em',         // Ensure it's circular
                backgroundImage: `url(${album.images[0].url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                overflow: 'hidden',
                transition: 'opacity 0.5s',
                opacity: imageLoaded ? 1 : 0,
            }}
        >
            <div
                className="SpotifyCollectionItem"
                style={{
                    width: '100%',            // Fill the parent element
                    height: '100%',           // Fill the parent element
                }}
                onClick={() => {
                    console.log("Navigating to: ", `/album/${album.id}`);
                    navigate(`/album/${album.id}`);
                }}
            >
                <span className={`CollectionName ${show_name ? " ShowName" : ""}`}>
                    {album.name}
                </span>
            </div>
        </Tilt>
    );
}

function TrackItem({ track, album, show_art = true, show_artist = true }) {
    const { apiCallWithTokenRefresh, playSong } = useSpotify();
    const [albumData, setAlbumData] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (track.album == undefined) {
            if (album != undefined) {
                setAlbumData(album);
            }
        } else {
            setAlbumData(track.album);
        }
    }, [album, track])

    useEffect(() => {
        if (albumData == null) return;
        const img = new Image();
        img.src = albumData.images[0].url;
        img.onload = () => {
            setImageLoaded(true);
        }
    }, [albumData])

    const playTrack = () => {
        // Call the playSong function from the SpotifyContext, passing in the track uri within an array
        // This will play the track
        apiCallWithTokenRefresh((token) => playSong(token, [track.uri]))
            .then(() => {
                console.log("Playing song");
            })
            .catch((error) => {
                console.error("Error playing song: ", error);
            });
    }

    return (
        <div className="TrackItem"
        style={
            {
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.5s',
            }
        }
        
        >
            {show_art && albumData && <img className="TrackArt"
                onClick={() => {
                    console.log("Navigating to: ", `/album/${albumData.id}`);
                    navigate(`/album/${albumData.id}`);
                }}

                src={albumData.images[0].url} alt="Album Art" />}

            <p className="TrackName">{track.name}</p>

            {show_artist && (
                <p className="TrackArtist">
                    <NavLink to={`/artist/${track.artists[0].id}`}>
                        {track.artists[0].name}
                    </NavLink>
                </p>
            )}

            <TrackItemPlayButton playTrack={playTrack} />
        </div>
    )
}

function TrackItemPlayButton({ playTrack }) {
    return (
        <div onClick={playTrack} style={{ color: 'black' }} className="TrackDownloadButton">
            <FontAwesomeIcon icon={faPlay} />
        </div>
    )
}