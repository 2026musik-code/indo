import { BrowserRouter as Router, Routes, Route, useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { Home, Compass, Film, User, Play, ChevronLeft, MoreHorizontal, Heart, MessageCircle, Share2, Bookmark, Loader2, Download, List, Search } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

// MOCK DATA for Video Feed
const MOCK_VIDEOS = [
  {
    id: '1',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    title: 'Cinta Sang Miliarder - Eps 1',
    description: 'Awal pertemuan yang tidak terduga...',
    likes: '12K',
    comments: '458',
    series: 'Miliarder Sombong'
  },
  {
    id: '2',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
    title: 'Cinta Sang Miliarder - Eps 2',
    description: 'Kesalahpahaman dimulai.',
    likes: '8.5K',
    comments: '320',
    series: 'Miliarder Sombong'
  }
];

const MOCK_SERIES = [
  { id: '1', title: 'Istri Pengganti', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', eps: 99, views: '1.2M' },
  { id: '2', title: 'Cinta Tak Direstui', image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80', eps: 50, views: '800K' },
  { id: '3', title: 'Miliarder Menyamar', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80', eps: 80, views: '3M' },
  { id: '4', title: 'Pembalasan Sang Mantan', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', eps: 120, views: '500K' },
];

function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="fixed bottom-0 w-full md:max-w-md bg-black/95 border-t border-slate-800 text-slate-400 z-50 px-6 py-2 flex justify-between items-center safe-area-bottom pb-4">
      <Link to="/" className={`flex flex-col items-center gap-1 transition-colors ${path === '/' ? 'text-white' : 'hover:text-white'}`}>
        <Home size={24} />
        <span className={`text-[10px] font-bold ${path === '/' ? 'text-white' : ''}`}>Home</span>
      </Link>
      <Link to="/discover" className={`flex flex-col items-center gap-1 transition-colors ${path === '/discover' ? 'text-white' : 'hover:text-white'}`}>
        <Compass size={24} />
        <span className={`text-[10px] font-bold ${path === '/discover' ? 'text-white' : ''}`}>Discover</span>
      </Link>
      <Link to="/watch/feed" className="flex items-center justify-center bg-white text-black w-11 h-8 rounded-lg font-bold">
        <Play size={20} className="" fill="black" />
      </Link>
      <Link to="/library" className={`flex flex-col items-center gap-1 transition-colors ${path === '/library' ? 'text-white' : 'hover:text-white'}`}>
        <Film size={24} />
        <span className={`text-[10px] font-bold ${path === '/library' ? 'text-white' : ''}`}>Library</span>
      </Link>
      <Link to="/profile" className={`flex flex-col items-center gap-1 transition-colors ${path === '/profile' ? 'text-white' : 'hover:text-white'}`}>
        <User size={24} />
        <span className={`text-[10px] font-bold ${path === '/profile' ? 'text-white' : ''}`}>Me</span>
      </Link>
    </nav>
  );
}

function Header({ pageTitle, onSearch }: { pageTitle: string, onSearch: (q: string) => void }) {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-slate-800 z-40 px-4 py-2.5 flex items-center justify-between transition-all">
      {!isSearching ? (
        <>
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">
            {pageTitle}
          </h1>
          <button onClick={() => setIsSearching(true)} className="text-slate-300 hover:text-white transition-colors p-1.5 -mr-1">
            <Search size={22} />
          </button>
        </>
      ) : (
        <div className="flex w-full items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
          <button onClick={() => { setIsSearching(false); setQuery(''); onSearch(''); }} className="text-slate-300 hover:text-white -ml-1">
            <ChevronLeft size={24} />
          </button>
          <input
            autoFocus
            type="text"
            placeholder="Cari drama..."
            className="flex-1 bg-slate-800/50 text-white placeholder-slate-400 border border-slate-700 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:border-slate-500 transition-colors"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onSearch(e.target.value);
            }}
          />
        </div>
      )}
    </header>
  );
}

function HomePage() {
  const [allSeries, setAllSeries] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTabTerbaru, setActiveTabTerbaru] = useState<'ID' | 'CN'>('ID');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const routerLocation = useLocation();
  const location = routerLocation.pathname;

  let pageTitle = "DRAMA INDO";
  if (location === "/discover") pageTitle = "Discover";
  if (location === "/library") pageTitle = "Library";
  if (location === "/profile") pageTitle = "Profile";

  useEffect(() => {
    fetch('/api/latest')
      .then(res => {
        if (!res.ok) throw new Error("API Route failed");
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setAllSeries(data.data);
          setSeries(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 120;
        
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: cardWidth + 12, behavior: 'smooth' });
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    filterData(activeCategory, q);
  };

  const handleCategorySelect = (category: string) => {
    const newCat = activeCategory === category ? null : category;
    setActiveCategory(newCat);
    filterData(newCat, searchQuery);
  };
  
  const filterData = (cat: string | null, q: string) => {
    let filtered = allSeries;
    if (cat) {
      filtered = filtered.filter(s => s.tags?.includes(cat));
    }
    if (q) {
      const lowerQ = q.toLowerCase();
      filtered = filtered.filter(s => s.title.toLowerCase().includes(lowerQ));
    }
    setSeries(filtered);
  };

  const categories = Array.from(new Set(allSeries.flatMap(s => s.tags || []))).filter(Boolean);

  // Split videos based on provider to simulate ID vs CN
  const rilisanTerbaru = series.filter(s => 
    activeTabTerbaru === 'ID' ? s.provider === 'pinedrama' : s.provider === 'dramabox'
  ).slice(1, 15); // increased items

  return (
    <div className="pb-24 min-h-screen">
      <Header pageTitle={pageTitle} onSearch={handleSearch} />

      {location === "/discover" && categories.length > 0 && (
        <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {categories.slice(0, 15).map((cat: any, i) => (
            <button 
              key={i} 
              onClick={() => handleCategorySelect(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${activeCategory === cat ? 'bg-red-600 text-white border-red-600' : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-red-500" size={32} />
        </div>
      ) : (
        <main className="px-3 space-y-3 mt-2">
          {/* Banner */}
          {series.length > 0 && (
            <section>
              <div className="w-full aspect-[4/5] sm:aspect-video bg-slate-800 rounded-xl overflow-hidden relative group cursor-pointer">
                <img src={series[0].cover} alt="Featured" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4">
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded w-fit mb-2">Baru Rilis</span>
                  <h2 className="text-2xl font-bold text-white mb-1 line-clamp-1">{series[0].title}</h2>
                  <p className="text-slate-300 text-sm line-clamp-2">{series[0].desc}</p>
                  <Link to={`/watch/feed?id=${series[0].id}&provider=${series[0].provider || 'pinedrama'}`} className="mt-4 bg-white text-black font-semibold py-2 px-4 rounded-full flex items-center justify-center gap-2 w-fit">
                    <Play size={16} fill="black" /> Tonton Sekarang
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Trending Section */}
          <section>
            {/* Tabs for ID or CN */}
            <div className="flex bg-slate-800/80 p-1 rounded-xl mb-3">
               <button 
                  onClick={() => setActiveTabTerbaru('ID')}
                  className={`flex-1 text-sm font-bold py-2 px-2 sm:px-4 rounded-lg transition-all ${activeTabTerbaru === 'ID' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                 INDONESIA
               </button>
               <button 
                  onClick={() => setActiveTabTerbaru('CN')}
                   className={`flex-1 text-sm font-bold py-2 px-2 sm:px-4 rounded-lg transition-all ${activeTabTerbaru === 'CN' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                 CHINA SUB INDO
               </button>
            </div>

            {rilisanTerbaru.length > 0 ? (
               <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide no-scrollbar">
                 {rilisanTerbaru.map((item) => (
                   <Link key={item.id} to={`/watch/feed?id=${item.id}&provider=${item.provider || 'pinedrama'}`} className="min-w-[100px] w-[100px] snap-start shrink-0 group">
                     <div className="aspect-video rounded-lg overflow-hidden relative mb-1">
                       <img src={item.cover} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                       <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded-tl font-medium">
                         {item.episodes} Eps
                       </div>
                     </div>
                     <h4 className="text-[10px] font-medium text-white line-clamp-2 leading-tight">{item.title}</h4>
                   </Link>
                 ))}
               </div>
            ) : (
                <div className="py-8 text-center text-slate-500">Belum ada rilis baru untuk kategori ini</div>
            )}
          </section>

          {/* Pilihan Untukmu */}
          <section>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-[16px] font-bold text-white">Rekomendasi</h3>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {series.slice(5).map((item, idx) => (
                <Link key={`fy-${item.id}-${idx}`} to={`/watch/feed?id=${item.id}&provider=${item.provider || 'pinedrama'}`} className="group">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden relative mb-1.5">
                    <img src={item.cover} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                    <div className="absolute top-0 right-0 bg-red-600/90 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-bl font-bold">
                       {item.provider === 'dramabox' ? 'CN' : 'ID'}
                    </div>
                  </div>
                  <h4 className="text-[12px] font-medium text-white line-clamp-2 leading-snug mb-0.5">{item.title}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">{item.episodes} Episode</p>
                </Link>
              ))}
            </div>
          </section>
        </main>
      )}
      <BottomNav />
    </div>
  );
}

function VideoFeedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get('id');
  const provider = searchParams.get('provider') || 'pinedrama';
  
  const [videos, setVideos] = useState<any[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [showEps, setShowEps] = useState(false);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  
  // Fetch details to get total episodes
  useEffect(() => {
    if (!collectionId) return;
    fetch(`/api/details/${provider}/${collectionId}`)
      .then(res => {
        if (!res.ok) throw new Error("API Route failed");
        return res.json();
      })
      .then(data => {
        if (data.success && data.data) {
          setTotalEpisodes(data.data.total_episodes || 0);
          
          try {
            const history = JSON.parse(localStorage.getItem('watch_history') || '[]');
            // Try to extract title, cover from local parameters if data doesn't have it explicitly
            const title = data.data.title || `Drama ${collectionId}`;
            const cover = data.data.cover || '';
            const historyItem = { 
              ...data.data, 
              id: collectionId, 
              provider: provider, 
              title: title,
              cover: cover,
              lastWatched: Date.now() 
            };
            const updatedHistory = history.filter((h: any) => h.id !== collectionId);
            updatedHistory.unshift(historyItem);
            localStorage.setItem('watch_history', JSON.stringify(updatedHistory));
          } catch (e) {
            console.error('Failed to save to history', e);
          }
        }
      })
      .catch(console.error);
  }, [collectionId, provider]);

  useEffect(() => {
    if (!collectionId) return;
    setLoading(true);
    
    // Fetch episode currentEpisode
    fetch(`/api/play/${provider}/${collectionId}/${currentEpisode}`)
      .then(res => {
        if (!res.ok) throw new Error("API Route failed");
        return res.json();
      })
      .then(data => {
        if (!data.success) {
          throw new Error(data.error || data.message || "Gagal memuat video");
        }
        return data;
      })
      .then(data => {
        if (data.videoUrl) {
          setVideos([{
            id: currentEpisode.toString(),
            url: data.videoUrl,
            rawUrl: data.rawUrl,
            title: data.title || `Episode ${currentEpisode}`,
            description: '',
            likes: '10K',
            comments: '120',
            series: 'SekaiDrama'
          }]);
        }
        setLoading(false);
        setErrorMsg(null);
      })
      .catch(err => {
        console.error(err);
        setErrorMsg(err.message);
        setLoading(false);
      });
  }, [collectionId, provider, currentEpisode]);

  if (loading && videos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 text-white flex justify-center items-center">
        <Loader2 className="animate-spin text-red-500" size={32} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 text-white">
      {/* Header Overlays */}
      <div className="absolute top-0 w-full z-50 bg-gradient-to-b from-black/60 to-transparent px-4 py-4 flex justify-between items-center pointer-events-none">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-white/80 hover:text-white pointer-events-auto cursor-pointer">
          <ChevronLeft size={28} />
        </button>
        <div className="flex bg-black/40 backdrop-blur border border-white/10 rounded-full px-4 py-1 text-sm font-medium text-white/90 pointer-events-auto cursor-pointer" onClick={() => setShowEps(true)}>
          Eps {currentEpisode} {totalEpisodes > 0 && `/ ${totalEpisodes}`}
        </div>
        <button className="p-2 -mr-2 text-white/80 hover:text-white pointer-events-auto cursor-pointer" onClick={() => setShowEps(true)}>
          <List size={24} />
        </button>
      </div>

      {loading && videos.length > 0 && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
           <Loader2 className="animate-spin text-red-500" size={32} />
         </div>
      )}

      {/* Video */}
      <div className="w-full h-full relative">
        {videos.length > 0 && !errorMsg ? (
          <VideoItem key={videos[0].id} video={videos[0]} isActive={true} />
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center gap-4 px-6 text-center">
            <p className="text-slate-400">{errorMsg || "Video tidak ditemukan."}</p>
            <button onClick={() => navigate(-1)} className="bg-red-600 px-6 py-2 rounded-full font-medium">Kembali</button>
          </div>
        )}
      </div>

      {/* Episodes Bottom Sheet */}
      {showEps && (
        <div className="absolute inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEps(false)} />
          <div className="w-full h-3/5 bg-slate-900 rounded-t-2xl relative z-10 flex flex-col">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg">Pilih Episode</h3>
              <button onClick={() => setShowEps(false)} className="text-slate-400 p-2">Tutup</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-900 grid grid-cols-5 gap-3 content-start">
              {Array.from({ length: totalEpisodes || 10 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentEpisode(i + 1);
                    setShowEps(false);
                  }}
                  className={`aspect-square rounded-lg flex justify-center items-center font-bold text-lg transition-colors ${
                    currentEpisode === i + 1 ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoItem({ video, isActive }: { video: any, isActive: boolean, key?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    } else if (!isActive && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: video.title,
        text: video.description,
        url: window.location.href,
      });
    } catch (e) {
      console.log('Error sharing', e);
    }
  };

  return (
    <div className="w-full h-full snap-start relative bg-slate-900 flex items-center justify-center">
      {/* Actual Video Element */}
      <video
        ref={videoRef}
        src={video.url}
        className="w-full h-full object-cover"
        loop
        playsInline
        referrerPolicy="no-referrer"
        onClick={togglePlay}
      />
      
      {/* Play/Pause Overlay indicator (optional, usually TikTok hides it when playing) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <div className="bg-black/40 p-4 rounded-full backdrop-blur-md">
            <Play size={40} className="text-white opacity-80" fill="white" />
          </div>
        </div>
      )}

      {/* Info Overlay (Bottom Left) */}
      <div className="absolute bottom-6 left-4 right-16 z-10 flex flex-col gap-2 drop-shadow-md pointer-events-none">
        <h3 className="font-bold text-lg">{video.series}</h3>
        <p className="text-sm text-white/90 font-medium">{video.title}</p>
        <p className="text-xs text-white/70 line-clamp-2">{video.description}</p>
      </div>

      {/* Actions (Bottom Right) */}
      <div className="absolute bottom-6 right-4 z-10 flex flex-col items-center gap-6 drop-shadow-md">
        <div className="flex flex-col items-center gap-1">
          <div 
            className="bg-black/40 p-2.5 rounded-full backdrop-blur-sm cursor-pointer hover:bg-black/60 transition-colors"
            onClick={() => setLiked(!liked)}
          >
            <Heart size={24} className={liked ? "text-red-500" : "text-white"} fill={liked ? "currentColor" : "none"} />
          </div>
          <span className="text-xs font-medium text-white/90">{liked ? '10K' : video.likes}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="bg-black/40 p-2.5 rounded-full backdrop-blur-sm cursor-pointer hover:bg-black/60 transition-colors">
            <MessageCircle size={24} className="text-white" />
          </div>
          <span className="text-xs font-medium text-white/90">{video.comments}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div 
            className="bg-black/40 p-2.5 rounded-full backdrop-blur-sm cursor-pointer hover:bg-black/60 transition-colors"
            onClick={() => setSaved(!saved)}
          >
            <Bookmark size={24} className={saved ? "text-yellow-400" : "text-white"} fill={saved ? "currentColor" : "none"} />
          </div>
          <span className="text-xs font-medium text-white/90">Save</span>
        </div>
        <div className="flex flex-col items-center gap-1" onClick={handleShare}>
          <div className="bg-black/40 p-2.5 rounded-full backdrop-blur-sm cursor-pointer hover:bg-black/60 transition-colors">
            <Share2 size={24} className="text-white" />
          </div>
          <span className="text-xs font-medium text-white/90">Share</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <a
            href={video.rawUrl || video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black/40 p-2.5 rounded-full backdrop-blur-sm cursor-pointer hover:bg-black/60 transition-colors flex items-center justify-center"
          >
            <Download size={24} className="text-white" />
          </a>
          <span className="text-xs font-medium text-white/90">Unduh</span>
        </div>
      </div>
    </div>
  );
}

function SearchIcon({ size }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

function LibraryPage() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('watch_history') || '[]');
      setHistory(saved);
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div className="pb-24 min-h-screen bg-black">
      <header className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-slate-800 z-40 px-4 py-3.5 flex items-center justify-between">
        <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">
          Library
        </h1>
      </header>
      
      <main className="px-4 py-4 space-y-6">
        <section>
          <h2 className="text-white font-bold text-[16px] mb-3">Terkini Ditonton</h2>
          {history.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {history.map((item, idx) => (
                <Link key={item.id + '-' + idx} to={`/watch/feed?id=${item.id}&provider=${item.provider || 'pinedrama'}`} className="group">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden relative mb-1.5 bg-slate-800">
                    {item.cover ? (
                      <img src={item.cover} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                        No Cover
                      </div>
                    )}
                    <div className="absolute top-0 right-0 bg-red-600/90 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-bl font-bold">
                       {item.provider === 'dramabox' ? 'CN' : 'ID'}
                    </div>
                  </div>
                  <h4 className="text-[12px] font-medium text-white line-clamp-2 leading-snug mb-0.5">{item.title}</h4>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-sm">
              <Film size={40} className="mx-auto mb-2 opacity-50" />
              <p>Belum ada history tontonan</p>
            </div>
          )}
        </section>
      </main>
      
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans md:max-w-md md:mx-auto md:border-x md:border-slate-800 shadow-2xl relative overflow-x-hidden">
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/discover" element={<HomePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/profile" element={<HomePage />} />
          <Route path="/watch/feed" element={<VideoFeedPage />} />
        </Routes>
      </Router>
    </div>
  );
}

