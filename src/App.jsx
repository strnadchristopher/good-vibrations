import { Routes, Route, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react'
import './App.css'
import { faMagnifyingGlass, faPlay, faPause, faForward, faBackward, faLeftLong, faHouse, faCaretUp, faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SpotifyProvider } from './SpotifyContext';
import { SpotifyHome, SpotifyPlaylistBrowser, PlaylistExplorer, SpotifyAlbumsBrowser, AlbumExplorer, SubscribedArtistsBrowser, ArtistExplorer, MusicSearch } from './music/Music';
import { useSpotify } from './SpotifyContext';


const client_id = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const client_secret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
const auth = btoa(`${client_id}:${client_secret}`)

// Before we start rendering anything, check the local storage for the spotify access token and set it in state
// If the access token is not found, we should redirect to the spotify login page
// If the access token is found, we should render the main application

let storage_access_token = localStorage.getItem('spotify_access_token')
let storage_refresh_token = localStorage.getItem('spotify_refresh_token')

console.log("Spotify Access Token: ", storage_access_token)
console.log("Spotify Refresh Token: ", storage_refresh_token)


function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [search_box_text, set_search_box_text] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [show_search_bar, set_show_search_bar] = useState(false);


  // Startup functions
  useEffect(() => {
    console.log("Vite App Name", import.meta.env.VITE_APP_NAME)
    // Print if we are in production or development env
    // Add an event listener for ctrl + f, which will focus the search bar
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key == 'f') {
        e.preventDefault();
        set_show_search_bar(true)
      }
    })

    return () => {
      // Remove the event listener when the component is unmounted
      window.removeEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key == 'f') {
          e.preventDefault();
          document.querySelector('.SearchBar').focus()
          set_search_box_text('')
        }
      })
    }
  }, [])
  // eslint-disable-next-line no-unused-vars
  const handle_spotify_error = (error) => {
    localStorage.removeItem('spotify_access_token')
    localStorage.removeItem('spotify_refresh_token')
  }


  const handle_search_box_update = (e) => {
    // Function that fires when the search bar has a keyup event, it should wait two seconds before calling the api
    set_search_box_text(e.target.value)
  }

  return (
    <SpotifyProvider>
      {location.pathname !== "/login" && <Navbar
        location={location}
        navigate={navigate}
        show_search_bar={show_search_bar}
        set_search_box_text={set_search_box_text}
        set_show_search_bar={set_show_search_bar}
        search_box_text={search_box_text}
        handle_search_box_update={handle_search_box_update}
      />}
      <BackgroundImage />
      <WebPlayback />
      <FullScreenPlayer />

      <AnimatedRoutes
        navigate={navigate}
        set_search_box_text={set_search_box_text}
        handle_spotify_error={handle_spotify_error}
      />
    </SpotifyProvider>
  )
}

function BackgroundImage() {
  const { currentlyPlayingBgImage, bgImageSrc } = useSpotify();
  // When the backgroundImage.src changes, set the background image to the new image

  return (
    <div className="BackgroundImageContainer"
      style={
        {
          backgroundImage: `url(${currentlyPlayingBgImage ? currentlyPlayingBgImage : (bgImageSrc ? bgImageSrc : '')})`
        }
      }

    >
      {/* <img className="BackgroundImage" src={bgImageSrc} alt="Background Image" /> */}
      <div className="BackgroundImageOverlay"></div>
    </div>
  );
}

// Page for when the user has not logged into spotify
function LandingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (localStorage.getItem('spotify_access_token')) {
      console.log("Already logged in");
      navigate('/artists');
    }
  }, [location, navigate])

  return (
    <div className="App">
      <h1>Login To Spotify To Continue...</h1>
      <a href={`https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${import.meta.env.VITE_CALLBACK_URL}&scope=user-read-private%20user-read-email%20user-follow-read%20user-library-read%20playlist-read-private%20playlist-read-collaborative%20user-top-read%20user-read-playback-state%20user-read-currently-playing%20user-modify-playback-state%20user-read-playback-position%20user-read-recently-played%20user-library-modify%20playlist-modify-public%20playlist-modify-private%20user-follow-modify%20user-read-private%20user-read-email%20streaming`}>Login to Spotify</a>
    </div>
  )
}


function WebPlayback() {
  const {
    player,
    currentTrack,
    paused,
    trackProgress,
    trackDuration,
    currentVolume,
    playerConnected,
    setTrackProgress,
    setCurrentVolume,
    randomPlayerName,
    setShowFullScreenPlayer
  } = useSpotify();
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!paused) {
        setTrackProgress((prev) => prev + 1000);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [paused, setTrackProgress]);

  return (
    <div className={"WebPlaybackControls" + (playerConnected ? " PlayerConnected" : "")}>
      {currentTrack && <div className="WebPlaybackControlsBackgroundImageContainer">
        <img className="WebPlaybackControlsBackgroundImage" src={currentTrack ? currentTrack.album.images[0].url : ''} alt="Album Art" />
        <div className="WebPlaybackControlsBackgroundImageOverlay"></div>
      </div>}
      {currentTrack && <input className="WebPlaybackControlsProgressBar" type="range" min="0" max={trackDuration} value={trackProgress}
        onChange={(e) => {
          player.seek(e.target.value);
        }}
      />}
      <div className="SongInfo WebPlaybackControlsSection">
        <div className="SongInfoTrackDetails">
          <span className="PlaybackTrackName">{currentTrack ? currentTrack.name : 'No Track Playing, Device Name is ' + randomPlayerName}</span>
          <br />
          <span className="PlaybackArtistName">{currentTrack ? currentTrack.artists[0].name : ''}</span>
        </div>
      </div>
      {currentTrack && <div className="SongInfoAlbumArtContainer">
        <img className="SongInfoAlbumArt" src={currentTrack ? currentTrack.album.images[0].url : ''} alt="Album Art" />
        <div className="PlaybackControls">
          <FontAwesomeIcon className="PlaybackControlButton" icon={faBackward}
            onClick={() => {
              player.previousTrack();
            }}
          />
          <FontAwesomeIcon className="PlaybackControlButton" icon={paused ? faPlay : faPause} onClick={() => {
            player.togglePlay();
          }} />
          <FontAwesomeIcon className="PlaybackControlButton" icon={faForward}
            onClick={() => {
              player.nextTrack();
            }}
          />
        </div>
      </div>}
      {currentTrack && <div className="VolumeControls WebPlaybackControlsSection">
        <input type="range" min="0" max="100" value={currentVolume}
          onChange={(e) => {
            let newVolume = e.target.value / 100;
            player.setVolume(newVolume);
            setCurrentVolume(e.target.value);
          }}
        />
        <div
          onClick={() => {
            setShowFullScreenPlayer(true);
          }}
          className="ExpandIconContainer">
          <FontAwesomeIcon className="ExpandIcon" icon={faCaretUp} />
        </div>
      </div>}
    </div>
  );
}

function FullScreenPlayer() {
  const {
    player,
    currentTrack,
    paused,
    trackProgress,
    trackDuration,
    currentVolume,
    setCurrentVolume,
    randomPlayerName,
    currentlyPlayingBgImage,
    showFullScreenPlayer,
    setShowFullScreenPlayer
  } = useSpotify();

  return (
    <div className={"FullScreenWebPlayer" + (showFullScreenPlayer ? " ShowFullScreenWebPlayer" : "")} style={{ backgroundImage: `url(${currentlyPlayingBgImage ? currentlyPlayingBgImage : (currentTrack ? currentTrack.album.images[0].url : '')})` }}>
      <div className="FullScreenWebPlayerBGOverlay">
      </div>
      <div className="FullScreenWebPlayerCloseButtonContainer"
      onClick={() => {
        setShowFullScreenPlayer(false);
      }}
      >
        <FontAwesomeIcon className="FullScreenWebPlayerCloseButton" icon={faCaretDown}
        />
      </div>
      {currentTrack && <div className="FullScreenWebPlayerBackgroundImageContainer">
        <img className={"FullScreenWebPlayerAlbumArt" + (!paused ? " PlayingAnimation" : "")} src={currentTrack ? currentTrack.album.images[0].url : ''} alt="Album Art" />
      </div>}
      <div className="FullScreenWebPlayerControls">
        <div className="FullScreenWebPlayerSongInfo">
          <div className="FullScreenWebPlayerSongInfoTrackDetails">
            <span className="FullScreenWebPlayerPlaybackTrackName">{currentTrack ? currentTrack.name : 'No Track Playing, Device Name is ' + randomPlayerName}</span>
            <br />
            <span className="FullScreenWebPlayerPlaybackArtistName">{currentTrack ? currentTrack.artists[0].name : ''}</span>
          </div>
        </div>
        {currentTrack && <input className="FullScreenWebPlayerProgressBar" type="range" min="0" max={trackDuration} value={trackProgress}
          onChange={(e) => {
            player.seek(e.target.value);
          }}
        />}
        {currentTrack && <div className="FullScreenWebPlayerPlaybackControls">
          <FontAwesomeIcon className="FullScreenWebPlayerPlaybackControlButton" icon={faBackward}
            onClick={() => {
              player.previousTrack();
            }}
          />
          <FontAwesomeIcon className="FullScreenWebPlayerPlaybackControlButton" icon={paused ? faPlay : faPause} onClick={() => {
            player.togglePlay();
          }} />
          <FontAwesomeIcon className="FullScreenWebPlayerPlaybackControlButton" icon={faForward}
            onClick={() => {
              player.nextTrack();
            }}
          />
        </div>}
        {currentTrack && <div className="FullScreenWebPlayerVolumeControls">
          <input type="range" min="0" max="100" value={currentVolume}
            onChange={(e) => {
              let newVolume = e.target.value / 100;
              player.setVolume(newVolume);
              setCurrentVolume(e.target.value);
            }}
          />
        </div>}
      </div>
    </div>
  )
}

function Navbar(props) {
  return (
    <div className={"Navbar" + (props.show_search_bar ? " ShowSearchBar" : "")}>
      {/* Search bar */}
      <SearchBar
        search_box_text={props.search_box_text}
        set_search_box_text={props.set_search_box_text}
        navigate={props.navigate}
        handle_search_box_update={props.handle_search_box_update}
        location={location}
        set_last_search_url={props.set_last_search_url}
        set_show_search_bar={props.set_show_search_bar}
        show_search_bar={props.show_search_bar}
      />
      <div className={"NavbarBigLinks" + (props.show_search_bar ? " HideNavbarLinks" : "")}>
        {/* Add a className to each link that matches the current page, i.e. if we're on popular, give it the "NavbarLinkActive" class */}
        {/* HAve navlink for playlists as well at /playlists */}
        <NavLink
          className={props.location.pathname.includes("manage") ? "NavbarLinkActive" : "NavbarLinkInactive"}
          to={
            `/home`
          }><FontAwesomeIcon icon={faHouse} />
        </NavLink>
        <NavLink
          className={props.location.pathname.includes("artists") ? "NavbarLinkActive" : "NavbarLinkInactive"}
          to={`/artists`}>Your Artists
        </NavLink>
        <NavLink
          className={props.location.pathname.includes("playlists") ? "NavbarLinkActive" : "NavbarLinkInactive"}
          to={`/playlists`}>Playlists
        </NavLink>
        <NavLink
          className={props.location.pathname.includes("albums") ? "NavbarLinkActive" : "NavbarLinkInactive"}
          to={
            `/albums`
          }>Albums
        </NavLink>
        {/* Button to show saerch bar */}
        <span
          onClick={() => {
            props.set_show_search_bar(true)
          }}
          className="NavbarLinkInactive NavbarSearchButton"><FontAwesomeIcon icon={faMagnifyingGlass} />
        </span>
      </div>
    </div>
  )
}

function SearchBar(props) {
  // When set_show_search_bar is called, we should focus the search bar
  useEffect(() => {
    if (props.show_search_bar) {
      document.querySelector('.SearchBarInput').focus()
    }
  }, [props.show_search_bar])
  const handle_search = (media_type) => {
    // Url encode the search box text
    let search_query = encodeURIComponent(props.search_box_text)
    // If the media type is tv, we should navigate to /tv/search/:search_query/1
    // If the media type is movies, we should navigate to /movies/search/:search_query/1
    if (media_type == "tv") {
      props.navigate(`/tv/search/${search_query}/1`)
    } else if (media_type == "movies") {
      props.navigate(`/movies/search/${search_query}/1`)
    } else if (media_type == "music") {
      props.navigate(`/search/${search_query}/1`)
    }
  }
  return (
    <div className={"SearchBarContainer" + (props.show_search_bar ? " ShowSearchBar" : " HideSearchBar")}>
      <span
        onClick={() => {
          props.set_search_box_text('')
          props.set_show_search_bar(false)
        }}
        className="SearchBarIcon NavbarSearchButton"><FontAwesomeIcon icon={faLeftLong} /></span>
      <input
        autoCorrect='off'
        autoCapitalize='off'
        // Also disable any spellcheck
        spellCheck='false'
        onChange={props.handle_search_box_update}
        onFocus={(e) => {
          // Clear the value of the search box when it is focused
          e.target.value = ''
        }}
        // Add an enter key listener to call the search_movie_db method
        onKeyPress={(e) => {
          if (e.key === 'Enter' && props.search_box_text.length > 0) {
            e.target.blur();
            props.set_show_search_bar(false)
            // Url encode the search box text
            let search_query = encodeURIComponent(props.search_box_text)
            // If the media type is tv, we should navigate to /tv/search/:search_query/1
            // If the media type is movies, we should navigate to /movies/search/:search_query/1
            props.navigate(`/search/${search_query}/1`)
          }
        }}
        value={props.search_box_text} type="text"
        placeholder={"Find Tracks, Artists and Albums"}
        className="SearchBarInput" />
      <span
        onClick={() => {
          handle_search('music')
        }}

        className="SearchBarIcon NavbarSearchButton"><FontAwesomeIcon icon={faMagnifyingGlass} /></span>
    </div>
  )
}

function AnimatedRoutes({
  set_search_box_text,
  spotify_access_token,
  handle_spotify_error
}) {
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<RootRedirector />} />
      <Route path="/home" element={<SpotifyHome />} />
      <Route path="/playlists" element={<SpotifyPlaylistBrowser spotify_access_token={spotify_access_token} handle_spotify_error={handle_spotify_error} />} />
      <Route path="/playlist/:playlist_id" element={<PlaylistExplorer spotify_access_token={spotify_access_token} handle_spotify_error={handle_spotify_error} />} />
      <Route path="/albums" element={<SpotifyAlbumsBrowser spotify_access_token={spotify_access_token} handle_spotify_error={handle_spotify_error} />} />
      <Route path="/album/:album_id" element={<AlbumExplorer spotify_access_token={spotify_access_token} handle_spotify_error={handle_spotify_error} />} />
      <Route path="/artists" element={<SubscribedArtistsBrowser spotify_access_token={spotify_access_token} handle_spotify_error={handle_spotify_error} />} />
      <Route path="/artist/:artist_id" element={<ArtistExplorer spotify_access_token={spotify_access_token} handle_spotify_error={handle_spotify_error} />} />
      <Route path="/search/:search_query/:page" element={<MusicSearch spotify_access_token={spotify_access_token} handle_spotify_error={handle_spotify_error} />} />
      <Route path="/spotify" element={<SpotifyCallbackHandler set_spotify_access_token={set_search_box_text} />} />
      <Route path="/login" element={<LandingPage />} />
    </Routes>
  )
}

// Ignore unused
// eslint-disable-next-line no-unused-vars
function SpotifyCallbackHandler({ set_spotify_access_token }) {
  // This component will be used to handle the callback from the spotify api
  // We will use the code query parameter to get the access token
  // We will then store the access token in local storage
  // We will then redirect to the music page
  const location = useLocation();
  const navigate = useNavigate();
  const [spotifyAuthSuccess, set_spotifyAuthSuccess] = useState(false)
  useEffect(() => {
    // Get the access token from the code query parameter
    let code = new URLSearchParams(location.search).get('code')
    // Pass the code, grant_type as 'authorization_code, and pass the redirect_uri, which is http://localhost:6969/spotify
    console.log("Code: ", code)
    fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${import.meta.env.VITE_CALLBACK_URL}`
    }).then(res => res.json())
      .then(data => {
        console.log('Spotify Auth Response:', data)
        // This returns access_token, token_type, scropes, expires_in, refresh_token
        // Let's save the access token and refresh token in local storage
        if (data.error || data.access_token == undefined || data.refresh_token == undefined) {
          console.log("Spotify Auth Failed")
          localStorage.removeItem('spotify_access_token')
          localStorage.removeItem('spotify_refresh_token')
          set_spotifyAuthSuccess(false);
          navigate('/artists')
          return
        }
        localStorage.setItem('spotify_access_token', data.access_token)
        localStorage.setItem('spotify_refresh_token', data.refresh_token)
        set_spotify_access_token(data.access_token)
        set_spotifyAuthSuccess(true);
        // Navigate to /music
        navigate('/artists')
      })
  }, [location.search, navigate, set_spotify_access_token])
  return <div>

    {
      spotifyAuthSuccess ? <p>Spotify Auth Success</p> : <p>Spotify Auth Failed</p>
    }

  </div>
}

function RootRedirector() {
  const navigate = useNavigate();
  useEffect(() => {
    // If media_type is tv or movie, we should redirect to the popular page of that media type
    navigate("/artists")
  })
  return <div></div>
}


export default App
