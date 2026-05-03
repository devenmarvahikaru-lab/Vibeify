const API_KEY = 'AIzaSyCT73_r5b0GmePh_XVRfCeZT8Gb5HHO3Zo';
const CLIENT_ID = '598611791372-f62e0iopf67sbgfgpjm83hdp77r7hpn5.apps.googleusercontent.com';

let player, currentIndex = 0, playlist = [];
let userPlaylists = JSON.parse(localStorage.getItem('v_playlists')) || [];
let likedSongs = JSON.parse(localStorage.getItem('v_likes')) || [];
let tokenClient;

// 1. YouTube IFrame API
function onYouTubeIframeAPIReady() {
    player = new YT.Player('yt-player', {
        height: '0', width: '0',
        events: { 
            'onReady': () => { 
                fetchData('Top Hits 2026 Indonesia', 'homeGrid'); 
                renderPlaylists(); 
            },
            'onStateChange': onStateChange 
        }
    });
}

// 2. Navigation
function switchPage(pageId, title, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.getElementById('headerTitle').innerText = title;

    document.querySelectorAll('.nav-btn').forEach(n => {
        n.classList.remove('text-white');
        n.classList.add('text-zinc-500');
    });

    el.classList.remove('text-zinc-500');
    el.classList.add('text-white');

    if(pageId === 'libraryPage') renderPlaylists();
}

// 3. Search & Fetch Data
async function fetchData(query, containerId = 'homeGrid') {
    try {
        const res = await fetch(`https://vibeify-delta.vercel.app?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`);
        const data = await res.json();
        
        if (data.error) {
            console.error("API Error:", data.error.message);
            return;
        }

        [span_7](start_span)// Matikan filter ketat supaya lagu tidak hilang[span_7](end_span)
        const items = data.items || [];
        playlist = items; 
        
        renderMusic(items, containerId);
    } catch (e) { 
        console.error("Gagal mengambil data atau kuota habis", e);
    }
}

function renderMusic(songs, containerId) {
    const grid = document.getElementById('quickGrid');
    const list = document.getElementById('quickList');
    const searchRes = document.getElementById('searchResults');

    if(containerId === 'homeGrid') {
        [span_8](start_span)// Render Panggilan Cepat (Grid)[span_8](end_span)
        grid.innerHTML = songs.slice(0, 6).map((s, i) => `
            <div class="grid-item active:scale-95 transition" onclick="playMusic(${i})">
                <img src="${s.snippet.thumbnails.high.url}" class="w-full h-full object-cover">
                <div class="grid-overlay truncate">${s.snippet.title.substring(0, 20)}...</div>
            </div>
        `).join('');
        [span_9](start_span)// Render Pilihan Cepat (List)[span_9](end_span)
        list.innerHTML = songs.slice(6, 15).map((s, i) => musicItemTemplate(s, i)).join('');
    } else {
        [span_10](start_span)// Render Search Results[span_10](end_span)
        searchRes.innerHTML = songs.map((s, i) => musicItemTemplate(s, i)).join('');
    }
}

function musicItemTemplate(s, i) {
    const cleanTitle = s.snippet.title.replace(/Official Video|Music Video|Official Audio/gi, '');
    return `
        <div class="flex items-center justify-between active:bg-zinc-900 rounded-lg p-1 transition" onclick="playMusic(${i})">
            <div class="flex items-center gap-4 flex-1 overflow-hidden">
                <img src="${s.snippet.thumbnails.default.url}" class="w-12 h-12 rounded-lg object-cover">
                <div class="flex flex-col overflow-hidden">
                    <h4 class="font-bold text-sm truncate">${cleanTitle}</h4>
                    <p class="text-[11px] text-zinc-500 truncate uppercase">${s.snippet.channelTitle}</p>
                </div>
            </div>
            <i class="fas fa-plus text-zinc-400 p-2" onclick="event.stopPropagation();"></i>
        </div>
    `;
}

// 4. Player Core
function playMusic(index) {
    if(!playlist[index]) return;
    currentIndex = index;
    const song = playlist[currentIndex];
    player.loadVideoById(song.id.videoId);
    document.getElementById('miniPlayer').classList.remove('hidden');
    updateUI(song);
}

function updateUI(song) {
    const cleanTitle = song.snippet.title.replace(/Official Video|Music Video/gi, '');
    const thumb = song.snippet.thumbnails.high.url;
    document.getElementById('miniTitle').innerText = cleanTitle;
    document.getElementById('miniArtist').innerText = song.snippet.channelTitle;
    document.getElementById('miniArt').src = thumb;
}

function onStateChange(e) {
    const isPlaying = e.data === 1;
    document.getElementById('miniPlayBtn').className = isPlaying ? 'fas fa-pause' : 'fas fa-play ml-0.5';
    if(e.data === 0) playNext();
}

function togglePlay() {
    const state = player.getPlayerState();
    state === 1 ? player.pauseVideo() : player.playVideo();
}

function playNext() { if(currentIndex < playlist.length-1) playMusic(currentIndex+1); }

// 5. Search Trigger
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') {
        fetchData(e.target.value, 'searchResults');
    }
});

// 6. Auth & Library (Simplified)
function initGoogleAuth() {
    if (typeof google !== 'undefined' && google.accounts) {
        if (!tokenClient) {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/youtube.force-ssl',
                callback: (res) => { if(res.access_token) alert("Tersambung!"); }
            });
        }
        tokenClient.requestAccessToken();
    }
}

function renderPlaylists() {
    const container = document.getElementById('userPlaylists');
    if(!container) return;
    container.innerHTML = userPlaylists.length === 0 ? 
        '<p class="text-zinc-500 text-xs">Belum ada playlist.</p>' :
        userPlaylists.map(p => `<div class="p-3 bg-[#121212] rounded-xl">${p.name}</div>`).join('');
}

// Progress Bar Logic
setInterval(() => {
    if(player && player.getCurrentTime) {
        const cur = player.getCurrentTime(), dur = player.getDuration();
        const per = (cur/dur)*100 || 0;
        const line = document.getElementById('miniProgressLine');
        if(line) line.style.width = per + "%";
    }
}, 1000);
