import { type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowUp,
  Backpack,
  BookOpen,
  ChevronRight,
  CirclePause,
  CirclePlay,
  Coins,
  LogOut,
  Hammer,
  Heart,
  LockKeyhole,
  Maximize2,
  Map,
  Moon,
  Move,
  Pickaxe,
  Play,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GameCanvas } from '@/game/GameCanvas';
import type { GameSnapshot } from '@/game/core/EventBus';
import { MATERIAL_ITEMS } from '@/game/data/items';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
const queryClient = new QueryClient();

type Panel = 'inventory' | 'crafting' | 'map' | 'pause' | null;
type TitleModal = 'settings' | 'credits' | 'exit' | null;

const TITLE_SCREEN_ASSET = `${import.meta.env.BASE_URL}assets/ui/emberwild-title-screen.png`;
const ENVIRONMENT_SHEET_ASSET = `${import.meta.env.BASE_URL}assets/sprites/emberwild-environment-sheet.png`;
const CHARACTER_SHEET_ASSET = `${import.meta.env.BASE_URL}assets/sprites/emberwild-character-sheet.png`;

type TitleAnimationTrack = {
  sheet: 'environment' | 'character';
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
  frameStride: number;
  destinationX: number;
  destinationY: number;
  destinationWidth: number;
  destinationHeight: number;
  frameDuration: number;
  opacity: number;
  composite: GlobalCompositeOperation;
};

function TitleAmbientAnimations() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return undefined;
    }

    let animationFrame = 0;
    let disposed = false;
    let started = false;
    const spriteSheets = {
      environment: new Image(),
      character: new Image(),
    };
    const processedSheets: Record<'environment' | 'character', HTMLCanvasElement | null> = {
      environment: null,
      character: null,
    };
    spriteSheets.environment.src = ENVIRONMENT_SHEET_ASSET;
    spriteSheets.character.src = CHARACTER_SHEET_ASSET;

    const tracks: TitleAnimationTrack[] = [
      {
        sheet: 'environment',
        sourceX: 775,
        sourceY: 194,
        sourceWidth: 56,
        sourceHeight: 70,
        frameStride: 85,
        destinationX: 1249,
        destinationY: 31,
        destinationWidth: 102,
        destinationHeight: 135,
        frameDuration: 115,
        opacity: 0.34,
        composite: 'screen',
      },
      {
        sheet: 'character',
        sourceX: 938,
        sourceY: 75,
        sourceWidth: 68,
        sourceHeight: 96,
        frameStride: 73,
        destinationX: 412,
        destinationY: 477,
        destinationWidth: 91,
        destinationHeight: 92,
        frameDuration: 105,
        opacity: 1,
        composite: 'screen',
      },
      {
        sheet: 'environment',
        sourceX: 775,
        sourceY: 32,
        sourceWidth: 56,
        sourceHeight: 50,
        frameStride: 85,
        destinationX: 1328,
        destinationY: 12,
        destinationWidth: 105,
        destinationHeight: 105,
        frameDuration: 140,
        opacity: 0.2,
        composite: 'screen',
      },
    ];

    const render = (time: number) => {
      if (disposed) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      if (processedSheets.environment && processedSheets.character) {
        tracks.forEach((track) => {
          const frame = Math.floor(time / track.frameDuration) % 8;
          const spriteSheet = processedSheets[track.sheet];
          if (!spriteSheet) {
            return;
          }
          context.save();
          context.globalCompositeOperation = track.composite;
          context.globalAlpha = track.opacity;
          context.imageSmoothingEnabled = false;
          context.drawImage(
            spriteSheet,
            track.sourceX + frame * track.frameStride,
            track.sourceY,
            track.sourceWidth,
            track.sourceHeight,
            track.destinationX,
            track.destinationY,
            track.destinationWidth,
            track.destinationHeight,
          );
          context.restore();
        });
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    const prepareSpriteSheet = (sheet: HTMLImageElement, name: 'environment' | 'character') => {
      const surface = document.createElement('canvas');
      surface.width = sheet.naturalWidth;
      surface.height = sheet.naturalHeight;
      const surfaceContext = surface.getContext('2d');
      if (!surfaceContext) {
        return;
      }

      surfaceContext.drawImage(sheet, 0, 0);
      const imageData = surfaceContext.getImageData(0, 0, surface.width, surface.height);
      for (let index = 0; index < imageData.data.length; index += 4) {
        const red = imageData.data[index];
        const green = imageData.data[index + 1];
        const blue = imageData.data[index + 2];
        if (Math.max(red, green, blue) < 48) {
          imageData.data[index + 3] = 0;
        }
      }
      surfaceContext.putImageData(imageData, 0, 0);
      processedSheets[name] = surface;
    };

    const start = () => {
      if (!disposed && !started && Object.values(spriteSheets).every((sheet) => sheet.complete && sheet.naturalWidth > 0)) {
        prepareSpriteSheet(spriteSheets.environment, 'environment');
        prepareSpriteSheet(spriteSheets.character, 'character');
        started = true;
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    Object.values(spriteSheets).forEach((spriteSheet) => spriteSheet.addEventListener('load', start));
    start();

    return () => {
      disposed = true;
      Object.values(spriteSheets).forEach((spriteSheet) => spriteSheet.removeEventListener('load', start));
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="title-ambient-animations"
      width="1672"
      height="941"
      aria-hidden="true"
    />
  );
}

function StartScreen({ onPlay }: { onPlay: () => void }) {
  const [modal, setModal] = useState<TitleModal>(null);
  const [soundEnabled, setSoundEnabled] = useState(
    () => window.localStorage.getItem('emberwild-sound') !== 'off',
  );

  const toggleSound = () => {
    setSoundEnabled((current) => {
      const next = !current;
      window.localStorage.setItem('emberwild-sound', next ? 'on' : 'off');
      return next;
    });
  };

  const enterFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
    }
  };

  const tryToExit = () => {
    window.close();
    setModal('exit');
  };

  return (
    <main className="title-screen" data-testid="title-screen">
      <div
        className="title-artboard"
        style={{ backgroundImage: `url("${TITLE_SCREEN_ASSET}")` }}
        aria-label="Emberwild: pantalla principal"
      >
        <TitleAmbientAnimations />
        <div className="title-hitboxes" aria-label="Menú principal">
          <button className="title-hitbox title-play" onClick={onPlay} data-testid="button-title-play">
            <Play className="sr-only" aria-hidden="true" />
            <span className="sr-only">Jugar</span>
          </button>
          <button className="title-hitbox title-settings" onClick={() => setModal('settings')} data-testid="button-title-settings">
            <Settings className="sr-only" aria-hidden="true" />
            <span className="sr-only">Ajustes</span>
          </button>
          <button className="title-hitbox title-credits" onClick={() => setModal('credits')} data-testid="button-title-credits">
            <BookOpen className="sr-only" aria-hidden="true" />
            <span className="sr-only">Créditos</span>
          </button>
          <button className="title-hitbox title-exit" onClick={tryToExit} data-testid="button-title-exit">
            <LogOut className="sr-only" aria-hidden="true" />
            <span className="sr-only">Salir</span>
          </button>
        </div>
      </div>

      {modal && (
        <div className="title-modal-backdrop" role="presentation">
          <section className="title-modal" role="dialog" aria-modal="true" aria-labelledby="title-modal-heading">
            <div className="title-modal-header">
              <div>
                <p className="title-modal-eyebrow">EMBERWILD · FIELD NOTES</p>
                <h1 id="title-modal-heading">
                  {modal === 'settings' && 'Ajustes'}
                  {modal === 'credits' && 'Créditos'}
                  {modal === 'exit' && 'Hasta pronto'}
                </h1>
              </div>
              <button className="title-modal-close" onClick={() => setModal(null)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            {modal === 'settings' && (
              <div className="title-settings-content">
                <button className="title-setting-row" onClick={toggleSound} data-testid="button-title-sound">
                  <span className="title-setting-icon">{soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}</span>
                  <span><strong>Efectos de sonido</strong><small>{soundEnabled ? 'Activados' : 'Desactivados'}</small></span>
                  <span className={`title-toggle ${soundEnabled ? 'on' : ''}`}><i /></span>
                </button>
                <button className="title-setting-row" onClick={enterFullscreen} data-testid="button-title-fullscreen">
                  <span className="title-setting-icon"><Maximize2 size={18} /></span>
                  <span><strong>Pantalla completa</strong><small>Expandir el campamento</small></span>
                  <ArrowLeft className="title-setting-arrow" size={16} />
                </button>
              </div>
            )}

            {modal === 'credits' && (
              <div className="title-credits-content">
                <div className="title-credits-mark">E</div>
                <p><strong>Emberwild</strong> es una aventura original de exploración, recolección y crafting.</p>
                <small>Diseño, código y mundo: Emberwild team<br />Arte de referencia: Adventure Lab</small>
              </div>
            )}

            {modal === 'exit' && (
              <div className="title-exit-content">
                <p>El navegador no siempre permite cerrar una pestaña desde una aplicación web.</p>
                <small>Podés cerrar esta pestaña cuando quieras. Tu partida queda guardada automáticamente.</small>
              </div>
            )}

            <button className="title-modal-back" onClick={() => setModal(null)}>
              <ArrowLeft size={16} /> Volver al menú
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

function StatBar({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Heart;
  label: string;
  value: number;
  tone: 'health' | 'energy';
}) {
  return (
    <div className="stat-bar" data-testid={`status-${tone}`}>
      <div className="stat-label">
        <Icon size={15} strokeWidth={2.3} />
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="bar-track">
        <span className={`bar-fill ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function PanelShell({
  title,
  eyebrow,
  icon: Icon,
  onClose,
  children,
}: {
  title: string;
  eyebrow: string;
  icon: typeof Backpack;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="panel-backdrop" data-testid={`panel-${title.toLowerCase()}`}>
      <section className="game-panel" role="dialog" aria-label={title}>
        <header className="panel-header">
          <div className="panel-heading">
            <div className="panel-icon"><Icon size={20} /></div>
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h2>{title}</h2>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label={`Close ${title}`} data-testid={`button-close-${title.toLowerCase()}`}>
            <X size={19} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function InventoryPanel({
  onClose,
  inventory,
}: {
  onClose: () => void;
  inventory: Record<string, number>;
}) {
  const usedSlots = MATERIAL_ITEMS.reduce((total, item) => total + (inventory[item.id] ?? item.count), 0);
  return (
    <PanelShell title="Pack" eyebrow="What you carry" icon={Backpack} onClose={onClose}>
      <div className="pack-summary">
        <span>{usedSlots} / 24 spaces used</span>
        <span className="pack-value">A few things worth keeping</span>
      </div>
      <div className="inventory-grid">
        {MATERIAL_ITEMS.map((item, index) => {
          return (
            <button className={`inventory-item item-${item.tone}`} key={item.name} data-testid={`item-inventory-${index}`}>
              <span className="item-art">
                <img className="item-sprite" src={item.asset} alt="" />
              </span>
              <span className="item-count">{inventory[item.id] ?? item.count}</span>
              <span className="item-name">{item.name}</span>
              <span className="item-detail">{item.detail}</span>
            </button>
          );
        })}
        {Array.from({ length: 8 }).map((_, index) => <div className="inventory-empty" key={`empty-${index}`} />)}
      </div>
      <div className="panel-tip"><Sparkles size={15} /> Items with a soft glint are useful nearby.</div>
    </PanelShell>
  );
}

function CraftingPanel({ onClose }: { onClose: () => void }) {
  const [selectedRecipe, setSelectedRecipe] = useState('hearth');
  const recipes = [
    { id: 'hearth', name: 'Field hearth', detail: 'A small place to make the dark feel less wide.', icon: Sparkles, materials: '6 emberwood  ·  3 river stone', ready: true },
    { id: 'satchel', name: 'Woven satchel', detail: 'More room for the things you find.', icon: Backpack, materials: '5 fibre bundle  ·  1 old coin', ready: false },
    { id: 'lantern', name: 'Glow lantern', detail: 'Keep a little dusk close at hand.', icon: Moon, materials: '2 mooncap  ·  4 emberwood', ready: false },
  ];
  return (
    <PanelShell title="Make something" eyebrow="Workbench" icon={Hammer} onClose={onClose}>
      <div className="recipe-list">
        {recipes.map((recipe) => {
          const Icon = recipe.icon;
          return (
            <button
              key={recipe.id}
              className={`recipe-row ${selectedRecipe === recipe.id ? 'selected' : ''}`}
              onClick={() => setSelectedRecipe(recipe.id)}
              data-testid={`button-recipe-${recipe.id}`}
            >
              <span className="recipe-icon"><Icon size={22} /></span>
              <span className="recipe-copy"><strong>{recipe.name}</strong><small>{recipe.detail}</small><em>{recipe.materials}</em></span>
              {recipe.ready ? <span className="ready-mark">Ready</span> : <span className="locked-mark">Gathering</span>}
            </button>
          );
        })}
      </div>
      <button className="primary-action wide" disabled={!recipes.find((recipe) => recipe.id === selectedRecipe)?.ready} data-testid="button-craft-selected">
        <Hammer size={16} /> Craft selected
      </button>
    </PanelShell>
  );
}

function MapPanel({
  onClose,
  snapshot,
  onUnlock,
}: {
  onClose: () => void;
  snapshot: GameSnapshot | null;
  onUnlock: (regionId: string) => void;
}) {
  const regions = snapshot?.world.regions ?? [];
  const coins = snapshot?.coins ?? 126;

  return (
    <PanelShell title="The frontier" eyebrow="A little further out" icon={Map} onClose={onClose}>
      <div className="map-card" data-testid="map-frontier">
        <div className="map-water" />
        <div className="map-ridge ridge-one" />
        <div className="map-ridge ridge-two" />
        <div className="map-path path-one" />
        <div className="map-path path-two" />
        <div className="map-pin pin-home"><span /></div>
        <div className="map-pin pin-river"><span /></div>
        <div className="map-pin pin-hollow"><span /></div>
        <div className="map-pin pin-bridge"><span /></div>
        <div className="map-label label-home">Your camp</div>
        <div className="map-label label-river">Whisper river</div>
        <div className="map-label label-hollow">Hollow grove</div>
        <div className="map-label label-bridge">Old bridge</div>
        <div className="map-compass"><ArrowUp size={14} /><span>N</span></div>
      </div>
      <div className="map-legend">
        <span><i className="legend-dot camp" /> Camp</span>
        <span><i className="legend-dot discovered" /> Discovered</span>
        <span><i className="legend-dot unknown" /> Unfamiliar</span>
      </div>
      <div className="frontier-summary">
        <span><Coins size={15} /> <strong>{coins}</strong> coins available</span>
        <small>Reach each quota to open the waterway.</small>
      </div>
      <div className="region-list" data-testid="region-list">
        {regions.map((region) => (
          <button
            key={region.id}
            className={`region-row ${region.unlocked ? 'unlocked' : 'locked'}`}
            disabled={region.unlocked || coins < region.unlockCost}
            onClick={() => onUnlock(region.id)}
            data-testid={`button-region-${region.id}`}
          >
            <span className="region-status">
              {region.unlocked ? <Map size={16} /> : <LockKeyhole size={16} />}
            </span>
            <span className="region-copy">
              <strong>{region.name}</strong>
              <small>{region.unlocked ? region.subtitle : `Quota: ${region.unlockCost} coins · ${region.subtitle}`}</small>
            </span>
            {region.unlocked ? <span className="region-state">Open</span> : <span className="region-cost"><Coins size={13} />{region.unlockCost}</span>}
          </button>
        ))}
      </div>
    </PanelShell>
  );
}

function PausePanel({ onClose, onResume }: { onClose: () => void; onResume: () => void }) {
  return (
    <PanelShell title="Taking a breath" eyebrow="Game paused" icon={CirclePause} onClose={onResume}>
      <div className="pause-art"><Moon size={34} strokeWidth={1.2} /><span>The wind is still for now.</span></div>
      <div className="pause-actions">
        <button className="primary-action wide" onClick={onResume} data-testid="button-resume"><CirclePlay size={16} /> Resume wandering</button>
        <button className="quiet-action" onClick={onClose} data-testid="button-settings"><Settings size={16} /> Settings</button>
      </div>
    </PanelShell>
  );
}

function GameHud({
  panel,
  setPanel,
  snapshot,
  onGather,
}: {
  panel: Panel;
  setPanel: (panel: Panel) => void;
  snapshot: GameSnapshot | null;
  onGather: () => void;
}) {
  const [selectedSlot, setSelectedSlot] = useState(0);
  const energy = 78;
  const hotbar = [
    { key: '1', label: 'Stone axe', icon: Pickaxe },
    { key: '2', label: MATERIAL_ITEMS[0].name, asset: MATERIAL_ITEMS[0].asset },
    { key: '3', label: MATERIAL_ITEMS[1].name, asset: MATERIAL_ITEMS[1].asset },
    { key: '4', label: MATERIAL_ITEMS[2].name, asset: MATERIAL_ITEMS[2].asset },
    { key: '5', label: MATERIAL_ITEMS[3].name, asset: MATERIAL_ITEMS[3].asset },
  ];
  const notice = snapshot?.feedback.message ?? 'The wilds are listening';
  const nearby = snapshot?.nearbyResource;
  const inventory = snapshot?.inventory ?? {};

  return (
    <>
      <header className="top-hud">
        <div className="brand-mark" aria-label="Emberwild">
          <span className="brand-spark"><span /></span>
          <div><strong>EMBERWILD</strong><small>field notes · day 04</small></div>
        </div>
        <div className="time-card" data-testid="status-time">
          <Moon size={15} /><span>DUSK</span><strong>18:42</strong><i>•</i><small>mild</small>
        </div>
        <div className="hud-actions">
           <div className="coin-readout" data-testid="text-currency"><span className="coin-glyph">$</span><strong>{snapshot?.coins ?? 126}</strong></div>
          <button className={`hud-button ${panel === 'inventory' ? 'active' : ''}`} onClick={() => setPanel(panel === 'inventory' ? null : 'inventory')} data-testid="button-open-inventory"><Backpack size={18} /><span>Pack</span><kbd>I</kbd></button>
          <button className={`hud-button ${panel === 'crafting' ? 'active' : ''}`} onClick={() => setPanel(panel === 'crafting' ? null : 'crafting')} data-testid="button-open-crafting"><Hammer size={18} /><span>Make</span><kbd>C</kbd></button>
          <button className={`hud-button ${panel === 'map' ? 'active' : ''}`} onClick={() => setPanel(panel === 'map' ? null : 'map')} data-testid="button-open-map"><Map size={18} /><span>Map</span><kbd>M</kbd></button>
          <button className="hud-button pause" onClick={() => setPanel('pause')} aria-label="Pause game" data-testid="button-pause"><CirclePause size={19} /></button>
        </div>
      </header>

      <div className="left-hud">
        <div className="character-badge"><span className="badge-face">E</span><span><strong>Rowan</strong><small>Wanderer</small></span></div>
        <div className="stats-card">
          <StatBar icon={Heart} label="Vitality" value={92} tone="health" />
          <StatBar icon={Zap} label="Energy" value={energy} tone="energy" />
        </div>
      </div>

      <div className={`toast-notice toast-${snapshot?.feedback.tone ?? 'neutral'}`} data-testid="status-world-notice" data-feedback-tone={snapshot?.feedback.tone ?? 'neutral'}><Sparkles size={14} /><span>{notice}</span></div>

      <div className="bottom-hud">
        <div className="movement-hint" data-testid="text-movement-hint"><Move size={15} /><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to wander</span></div>
        <div className="hotbar-wrap">
          <span className="hotbar-label">Carried close</span>
          <div className="hotbar" data-testid="hotbar">
            {hotbar.map((slot, index) => {
              const Icon = slot.icon;
              return (
                <button className={`hotbar-slot ${selectedSlot === index ? 'selected' : ''}`} onClick={() => setSelectedSlot(index)} key={slot.key} aria-label={`Select ${slot.label}`} data-testid={`button-hotbar-${index + 1}`}>
                  <kbd>{slot.key}</kbd>
                  {slot.asset ? <img className="hotbar-sprite" src={slot.asset} alt="" /> : Icon ? <Icon size={22} /> : null}
                  <span className="hotbar-count">{index === 0 ? 1 : inventory[MATERIAL_ITEMS[index - 1].id] ?? MATERIAL_ITEMS[index - 1].count}</span>
                </button>
              );
            })}
          </div>
        </div>
        <button className="action-hint" onClick={onGather} data-testid="button-action-gather">
          <span className="action-key">E</span><span><small>{nearby ? `${nearby.distance}px · ${nearby.durability}/${nearby.maxDurability}` : 'Nothing nearby'}</small><strong>{nearby ? 'Gather' : 'Explore'}</strong></span><ChevronRight size={17} />
        </button>
      </div>
    </>
  );
}

function Home() {
  const [panel, setPanel] = useState<Panel>(null);
  const [debug, setDebug] = useState(false);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [gatherRequest, setGatherRequest] = useState(0);
  const [unlockRegionRequest, setUnlockRegionRequest] = useState({ regionId: '', requestId: 0 });
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPanel((current) => (current === 'pause' ? null : 'pause'));
      }
      if (event.key === 'F3') {
        event.preventDefault();
        setDebug((current) => !current);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className={`game-shell ${panel ? 'has-panel' : ''}`}>
       <GameCanvas
         paused={panel === 'pause'}
         debug={debug}
         gatherRequest={gatherRequest}
          unlockRegionRequest={unlockRegionRequest}
         onSnapshot={setSnapshot}
       />
      <div className="world-vignette" />
       <GameHud
         panel={panel}
         setPanel={setPanel}
         snapshot={snapshot}
         onGather={() => setGatherRequest((request) => request + 1)}
       />
       {panel === 'inventory' && <InventoryPanel onClose={() => setPanel(null)} inventory={snapshot?.inventory ?? {}} />}
      {panel === 'crafting' && <CraftingPanel onClose={() => setPanel(null)} />}
       {panel === 'map' && (
         <MapPanel
           onClose={() => setPanel(null)}
           snapshot={snapshot}
           onUnlock={(regionId) => setUnlockRegionRequest((current) => ({
             regionId,
             requestId: current.requestId + 1,
           }))}
         />
       )}
      {panel === 'pause' && <PausePanel onClose={() => setPanel(null)} onResume={() => setPanel(null)} />}
    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={GameEntry} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function GameEntry() {
  const [started, setStarted] = useState(false);
  return started ? <Home /> : <StartScreen onPlay={() => setStarted(true)} />;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
