import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useMemo,
  useEffect,
  useState,
} from "react";
import { clearExpiredUserStatsCache } from "./utils/getUserStats";
import getUserStats, { UserStats } from "./utils/getUserStats";
import { loadBossFilterObj } from "./components/sidebar/BossIconFilterDialog";

function normalizeKey(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/\(.*?\)/g, "");
}

// Helper function to compute player weight from stats
function computePlayerWeight(stats: UserStats): number {
  const weights = loadBossFilterObj();
  let score = 0;
  if (stats && stats.activities) {
    for (const activity of stats.activities) {
      const key = normalizeKey(activity.name);
      if (weights[key] && weights[key].weight > 0) {
        score +=
          (activity.score > 0 ? activity.score : 0) *
          (weights[key].weight || 0);
      }
    }
  }
  return score;
}

// Helper function to fetch and store player stats
async function fetchAndStorePlayerStats(
  username: string,
  setPlayerStats: (username: string, stats: UserStats, weight: number) => void,
) {
  try {
    console.log(`Fetching stats for ${username}...`);
    const stats = await getUserStats(username);
    const weight = computePlayerWeight(stats);
    setPlayerStats(username, stats, weight);
    console.log(`Stored stats for ${username} with weight ${weight}`);
  } catch (error) {
    console.error(`Failed to fetch stats for ${username}:`, error);
  }
}

// Actions - Modify by adding more actions with payloads.
export type Action =
  | { type: "HYDRATE_FROM_STORAGE"; payload: State }
  | { type: "SET_DIMENSION"; payload: number }
  | { type: "SET_SCALE"; payload: number }
  | { type: "SET_OPEN_CREATE_TILE_DIALOG"; payload: boolean }
  | { type: "SET_OPEN_PNG_EXPORT_DIALOG"; payload: boolean }
  | { type: "SET_SHOW_TIME_INDICATORS"; payload: boolean }
  | { type: "REORDER_BINGO_BOARD"; payload: { from: number; to: number } }
  | {
      type: "ASSIGN_TILE_IDEA_TO_BINGO_TILE";
      payload: { tileIndex: number; tileIdeaId: string };
    }
  | {
      type: "CLEAR_BINGO_TILE";
      payload: { tileIndex: number };
    }
  | {
      type: "SET_EDITING_TILE_ID";
      payload: string | null;
    }
  | {
      type: "SET_CREATING_FOR_BOARD_INDEX";
      payload: number | null;
    }
  | { type: "CLEAR_BOARD" }
  | { type: "SHUFFLE_BOARD" }
  | { type: "ADD_TEAM"; payload: { name: string } }
  | { type: "EDIT_TEAM"; payload: { index: number; name: string } }
  | { type: "REMOVE_TEAM"; payload: { index: number } }
  | { type: "ADD_PLAYER"; payload: { username: string } }
  | { type: "EDIT_PLAYER"; payload: { index: number; username: string } }
  | { type: "REMOVE_PLAYER"; payload: { index: number } }
  | {
      type: "ASSIGN_PLAYER_TO_TEAM";
      payload: { playerIndex: number; teamId: string | null };
    }
  | {
      type: "ASSIGN_PLAYER_TO_TEAM_AT_POSITION";
      payload: { playerIndex: number; teamId: string | null; position: number };
    }
  | {
      type: "REORDER_PLAYERS_IN_TEAM";
      payload: { teamId: string; fromIndex: number; toIndex: number };
    }
  | {
      type: "SET_PLAYER_STATS";
      payload: { username: string; stats: UserStats; weight: number };
    }
  | { type: "REMOVE_PLAYER_STATS"; payload: { username: string } };

// State - Modify by adding more state properties.
export interface State {
  dimension: number;
  scale: number;
  bingoBoard: { id: string | null }[];
  openCreateTileDialog: boolean;
  openPngExportDialog: boolean;
  showTimeIndicators: boolean;
  editingTileId: string | null;
  creatingForBoardIndex: number | null;
  players: { username: string; teamId: string | null }[];
  teams: { name: string }[];
  playerStats: { [username: string]: { stats: UserStats; weight: number } };
}

// Initial State - Modify by ensuring state is correctly filled out.
const initialState: State = {
  dimension: 5,
  scale: 100,
  openCreateTileDialog: false,
  openPngExportDialog: false,
  showTimeIndicators: true,
  bingoBoard: Array.from({ length: 5 ** 2 }, () => ({ id: null })),
  editingTileId: null,
  creatingForBoardIndex: null,
  players: [],
  teams: [],
  playerStats: {},
};

// localStorage utilities
const STATE_STORAGE_KEY = "bingo-app-state";
const TILE_IDEAS_STORAGE_KEY = "bingo-tile-ideas";

function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading from localStorage key "${key}":`, error);
    return defaultValue;
  }
}

function saveToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
  }
}

// Custom hook for localStorage persistence that is SSR-safe
function useLocalStorageReducer<T, A>(
  reducer: (state: T, action: A) => T,
  initialState: T,
  storageKey: string,
  sanitize?: (loaded: any, initial: T) => T,
): [T, React.Dispatch<A>] {
  // Always start with initial state for SSR safety
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage only after component mounts (client-side only)
  useEffect(() => {
    if (!isInitialized) {
      const loaded = loadFromLocalStorage(storageKey, initialState);
      const finalState = sanitize
        ? sanitize(loaded, initialState)
        : { ...initialState, ...loaded };

      // Only dispatch if the loaded state is different from initial state
      if (JSON.stringify(finalState) !== JSON.stringify(initialState)) {
        // Replace the entire state
        dispatch({ type: "HYDRATE_FROM_STORAGE", payload: finalState } as A);
      }
      setIsInitialized(true);
    }
  }, [initialState, storageKey, sanitize, isInitialized]);

  // Save to localStorage whenever state changes (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      saveToLocalStorage(storageKey, state);
    }
  }, [state, storageKey, isInitialized]);

  return [state, dispatch];
}

// Reducer - Modify by adding more reducer cases.
function stateReducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE_FROM_STORAGE":
      return action.payload;
    case "SET_DIMENSION":
      return {
        ...state,
        dimension: action.payload,
        bingoBoard:
          state.bingoBoard.length === action.payload ** 2
            ? state.bingoBoard
            : state.bingoBoard.length > action.payload ** 2
            ? // Truncate if shrinking
              state.bingoBoard.slice(0, action.payload ** 2)
            : // Expand if growing
              [
                ...state.bingoBoard,
                ...Array.from(
                  { length: action.payload ** 2 - state.bingoBoard.length },
                  () => ({ id: null }),
                ),
              ],
      };
    case "SET_SCALE":
      return {
        ...state,
        scale: action.payload,
      };
    case "SET_OPEN_CREATE_TILE_DIALOG":
      return {
        ...state,
        openCreateTileDialog: action.payload,
      };
    case "SET_OPEN_PNG_EXPORT_DIALOG":
      return {
        ...state,
        openPngExportDialog: action.payload,
      };
    case "SET_SHOW_TIME_INDICATORS":
      return {
        ...state,
        showTimeIndicators: action.payload,
      };
    case "REORDER_BINGO_BOARD": {
      const { from, to } = action.payload;
      if (from === to) return state; // No change needed

      const newBoard = [...state.bingoBoard];
      // Simple swap: exchange the tiles at positions 'from' and 'to'
      [newBoard[from], newBoard[to]] = [newBoard[to], newBoard[from]];

      return { ...state, bingoBoard: newBoard };
    }
    case "ASSIGN_TILE_IDEA_TO_BINGO_TILE": {
      const { tileIndex, tileIdeaId } = action.payload;
      const newBoard = [...state.bingoBoard];
      newBoard[tileIndex] = { id: tileIdeaId };
      return { ...state, bingoBoard: newBoard };
    }
    case "CLEAR_BINGO_TILE": {
      const { tileIndex } = action.payload;
      const newBoard = [...state.bingoBoard];
      newBoard[tileIndex] = { id: null };
      return { ...state, bingoBoard: newBoard };
    }
    case "SET_EDITING_TILE_ID": {
      return {
        ...state,
        editingTileId: action.payload,
      };
    }
    case "SET_CREATING_FOR_BOARD_INDEX": {
      return {
        ...state,
        creatingForBoardIndex: action.payload,
      };
    }
    case "CLEAR_BOARD": {
      return {
        ...state,
        bingoBoard: Array.from({ length: state.dimension ** 2 }, () => ({
          id: null,
        })),
      };
    }
    case "SHUFFLE_BOARD": {
      // Fisher-Yates shuffle
      const newBoard = [...state.bingoBoard];
      for (let i = newBoard.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newBoard[i], newBoard[j]] = [newBoard[j], newBoard[i]];
      }
      return { ...state, bingoBoard: newBoard };
    }
    case "ADD_TEAM": {
      return {
        ...state,
        teams: [...state.teams, { name: action.payload.name }],
      };
    }
    case "EDIT_TEAM": {
      const newTeams = [...state.teams];
      newTeams[action.payload.index] = { name: action.payload.name };
      return { ...state, teams: newTeams };
    }
    case "REMOVE_TEAM": {
      const removedTeamIndex = action.payload.index;
      const newTeams = state.teams.filter((_, i) => i !== removedTeamIndex);

      // Update player teamIds to account for the index shift
      const newPlayers = state.players.map((p) => {
        if (p.teamId === null) return p;

        const currentTeamIndex = parseInt(p.teamId);

        // If player was in the removed team, unassign them
        if (currentTeamIndex === removedTeamIndex) {
          return { ...p, teamId: null };
        }

        // If player was in a team with a higher index, decrement their teamId
        if (currentTeamIndex > removedTeamIndex) {
          return { ...p, teamId: String(currentTeamIndex - 1) };
        }

        // Player was in a team with lower index, no change needed
        return p;
      });

      return { ...state, teams: newTeams, players: newPlayers };
    }
    case "ADD_PLAYER": {
      return {
        ...state,
        players: [
          ...state.players,
          { username: action.payload.username, teamId: null },
        ],
      };
    }
    case "EDIT_PLAYER": {
      const newPlayers = [...state.players];
      newPlayers[action.payload.index] = {
        ...newPlayers[action.payload.index],
        username: action.payload.username,
      };
      return { ...state, players: newPlayers };
    }
    case "REMOVE_PLAYER": {
      const newPlayers = state.players.filter(
        (_, i) => i !== action.payload.index,
      );
      return { ...state, players: newPlayers };
    }
    case "ASSIGN_PLAYER_TO_TEAM": {
      const newPlayers = [...state.players];
      newPlayers[action.payload.playerIndex] = {
        ...newPlayers[action.payload.playerIndex],
        teamId: action.payload.teamId,
      };
      return { ...state, players: newPlayers };
    }
    case "ASSIGN_PLAYER_TO_TEAM_AT_POSITION": {
      const { playerIndex, teamId, position } = action.payload;
      const newPlayers = [...state.players];
      const playerToMove = { ...newPlayers[playerIndex] };

      // Remove player from current position
      newPlayers.splice(playerIndex, 1);

      // Find the target position within the team
      let targetIndex = 0;
      if (teamId !== null) {
        // Count players in the target team to find the correct position
        let teamPlayerCount = 0;
        for (let i = 0; i < newPlayers.length; i++) {
          if (newPlayers[i].teamId === teamId) {
            if (teamPlayerCount === position) {
              targetIndex = i;
              break;
            }
            teamPlayerCount++;
          }
        }
        // If position is beyond current team size, add at the end
        if (teamPlayerCount <= position) {
          targetIndex = newPlayers.length;
        }
      }

      // Update player's team and insert at target position
      playerToMove.teamId = teamId;
      newPlayers.splice(targetIndex, 0, playerToMove);

      return { ...state, players: newPlayers };
    }
    case "REORDER_PLAYERS_IN_TEAM": {
      const { teamId, fromIndex, toIndex } = action.payload;
      const newPlayers = [...state.players];

      // Find all players in the team
      const teamPlayerIndices: number[] = [];
      newPlayers.forEach((player, index) => {
        if (player.teamId === teamId) {
          teamPlayerIndices.push(index);
        }
      });

      // Reorder within the team by swapping global indices
      if (
        fromIndex < teamPlayerIndices.length &&
        toIndex < teamPlayerIndices.length
      ) {
        const fromGlobalIndex = teamPlayerIndices[fromIndex];
        const toGlobalIndex = teamPlayerIndices[toIndex];

        // Remove the player from the original position and insert at new position
        const [movedPlayer] = newPlayers.splice(fromGlobalIndex, 1);
        newPlayers.splice(toGlobalIndex, 0, movedPlayer);
      }

      return { ...state, players: newPlayers };
    }
    case "SET_PLAYER_STATS": {
      const { username, stats, weight } = action.payload;
      return {
        ...state,
        playerStats: {
          ...state.playerStats,
          [username]: { stats, weight },
        },
      };
    }
    case "REMOVE_PLAYER_STATS": {
      const { username } = action.payload;
      const newStats = { ...state.playerStats };
      delete newStats[username];
      return {
        ...state,
        playerStats: newStats,
      };
    }
    // Add More Reducer Cases Here:
    default:
      return state;
  }
}

// Context
export interface StateContextType {
  state: State;
  dispatch: React.Dispatch<Action>;
  setDimension: (dimension: number) => void;
  setScale: (scale: number) => void;
  setOpenCreateTileDialog: (open: boolean) => void;
  setOpenPngExportDialog: (open: boolean) => void;
  setShowTimeIndicators: (show: boolean) => void;
  reorderBingoBoard: (from: number, to: number) => void;
  assignTileIdeaToBingoTile: (tileIndex: number, tileIdeaId: string) => void;
  clearBingoTile: (tileIndex: number) => void;
  setEditingTileId: (tileId: string | null) => void;
  setCreatingForBoardIndex: (index: number | null) => void;
  clearBoard: () => void;
  shuffleBoard: () => void;
  addTeam: (name: string) => void;
  editTeam: (index: number, name: string) => void;
  removeTeam: (index: number) => void;
  addPlayer: (username: string) => void;
  editPlayer: (index: number, username: string) => void;
  removePlayer: (index: number) => void;
  assignPlayerToTeam: (playerIndex: number, teamId: string | null) => void;
  assignPlayerToTeamAtPosition: (
    playerIndex: number,
    teamId: string | null,
    position: number,
  ) => void;
  reorderPlayersInTeam: (
    teamId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;
  setPlayerStats: (username: string, stats: UserStats, weight: number) => void;
  removePlayerStats: (username: string) => void;
  // Add more state management method types here:
}

const StateContext = createContext<StateContextType | undefined>(undefined);
export function StateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useLocalStorageReducer(
    stateReducer,
    initialState,
    STATE_STORAGE_KEY,
    (loaded, initial) => ({
      ...initial,
      ...loaded,
      // Ensure dimension and scale have consistent valid values to prevent hydration errors
      dimension:
        loaded?.dimension && [3, 4, 5, 6, 7].includes(loaded.dimension)
          ? loaded.dimension
          : initial.dimension,
      scale:
        loaded?.scale && loaded.scale >= 50 && loaded.scale <= 200
          ? loaded.scale
          : initial.scale,
    }),
  );

  // Clean up expired user stats cache on app initialization
  useEffect(() => {
    clearExpiredUserStatsCache();
  }, []);

  // Define the helper functions
  const setPlayerStats = (username: string, stats: UserStats, weight: number) =>
    dispatch({
      type: "SET_PLAYER_STATS",
      payload: { username, stats, weight },
    });

  const removePlayerStats = (username: string) =>
    dispatch({ type: "REMOVE_PLAYER_STATS", payload: { username } });

  // Listen for boss filter weight changes and recompute all weights
  useEffect(() => {
    const STORAGE_KEY = "bingo-boss-icon-filter";
    const handleWeightChange = async () => {
      // Recompute weights for all players that have stats
      for (const [username, playerData] of Object.entries(state.playerStats)) {
        const newWeight = computePlayerWeight(playerData.stats);
        setPlayerStats(username, playerData.stats, newWeight);
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        handleWeightChange();
      }
    };

    // Also check for changes in this tab
    const origSetItem = localStorage.setItem;
    localStorage.setItem = function (...args) {
      origSetItem.apply(this, args);
      if (args[0] === STORAGE_KEY) {
        handleWeightChange();
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      localStorage.setItem = origSetItem;
    };
  }, [state.playerStats]);

  // Fetch stats for any players that don't have stats yet
  useEffect(() => {
    const fetchMissingStats = async () => {
      for (const player of state.players) {
        if (!state.playerStats[player.username]) {
          await fetchAndStorePlayerStats(player.username, setPlayerStats);
        }
      }
    };
    fetchMissingStats();
  }, [state.players, state.playerStats]);

  const value: StateContextType = {
    state,
    dispatch,
    setDimension: (dimension: number) => {
      dispatch({ type: "SET_DIMENSION", payload: dimension });
    },
    setScale: (scale: number) => {
      dispatch({ type: "SET_SCALE", payload: scale });
    },
    setOpenCreateTileDialog: (open: boolean) => {
      dispatch({ type: "SET_OPEN_CREATE_TILE_DIALOG", payload: open });
    },
    setOpenPngExportDialog: (open: boolean) => {
      dispatch({ type: "SET_OPEN_PNG_EXPORT_DIALOG", payload: open });
    },
    setShowTimeIndicators: (show: boolean) => {
      dispatch({ type: "SET_SHOW_TIME_INDICATORS", payload: show });
    },
    reorderBingoBoard: (from: number, to: number) => {
      dispatch({ type: "REORDER_BINGO_BOARD", payload: { from, to } });
    },
    assignTileIdeaToBingoTile: (tileIndex: number, tileIdeaId: string) => {
      dispatch({
        type: "ASSIGN_TILE_IDEA_TO_BINGO_TILE",
        payload: { tileIndex, tileIdeaId },
      });
    },
    clearBingoTile: (tileIndex: number) => {
      dispatch({ type: "CLEAR_BINGO_TILE", payload: { tileIndex } });
    },
    setEditingTileId: (tileId: string | null) => {
      dispatch({ type: "SET_EDITING_TILE_ID", payload: tileId });
    },
    setCreatingForBoardIndex: (index: number | null) => {
      dispatch({ type: "SET_CREATING_FOR_BOARD_INDEX", payload: index });
    },
    clearBoard: () => {
      dispatch({ type: "CLEAR_BOARD" });
    },
    shuffleBoard: () => {
      dispatch({ type: "SHUFFLE_BOARD" });
    },
    addTeam: (name: string) =>
      dispatch({ type: "ADD_TEAM", payload: { name } }),
    editTeam: (index: number, name: string) =>
      dispatch({ type: "EDIT_TEAM", payload: { index, name } }),
    removeTeam: (index: number) =>
      dispatch({ type: "REMOVE_TEAM", payload: { index } }),
    addPlayer: (username: string) => {
      dispatch({ type: "ADD_PLAYER", payload: { username } });
      // Fetch stats for the new player
      fetchAndStorePlayerStats(username, setPlayerStats);
    },
    editPlayer: (index: number, username: string) => {
      const oldUsername = state.players[index]?.username;
      dispatch({ type: "EDIT_PLAYER", payload: { index, username } });
      // If username changed, remove old stats and fetch new ones
      if (oldUsername && oldUsername !== username) {
        removePlayerStats(oldUsername);
        fetchAndStorePlayerStats(username, setPlayerStats);
      }
    },
    removePlayer: (index: number) => {
      const username = state.players[index]?.username;
      dispatch({ type: "REMOVE_PLAYER", payload: { index } });
      // Remove stats for the deleted player
      if (username) {
        removePlayerStats(username);
      }
    },
    assignPlayerToTeam: (playerIndex: number, teamId: string | null) =>
      dispatch({
        type: "ASSIGN_PLAYER_TO_TEAM",
        payload: { playerIndex, teamId },
      }),
    assignPlayerToTeamAtPosition: (
      playerIndex: number,
      teamId: string | null,
      position: number,
    ) =>
      dispatch({
        type: "ASSIGN_PLAYER_TO_TEAM_AT_POSITION",
        payload: { playerIndex, teamId, position },
      }),
    reorderPlayersInTeam: (
      teamId: string,
      fromIndex: number,
      toIndex: number,
    ) =>
      dispatch({
        type: "REORDER_PLAYERS_IN_TEAM",
        payload: { teamId, fromIndex, toIndex },
      }),
    setPlayerStats: (username: string, stats: UserStats, weight: number) =>
      dispatch({
        type: "SET_PLAYER_STATS",
        payload: { username, stats, weight },
      }),
    removePlayerStats: (username: string) =>
      dispatch({ type: "REMOVE_PLAYER_STATS", payload: { username } }),
    // Add more state management methods here:
  };
  return (
    <StateContext.Provider value={value}>{children}</StateContext.Provider>
  );
}

// Hook to use the context
export function useAppState() {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within a provider.");
  }
  return context;
}

// --- TileIdeas types and context ---

export type TileIdea = {
  id: string;
  items: string[];
  description: string;
  timeToComplete?: number; // Optional time in hours
};

type TileIdeasAction =
  | { type: "ADD_TILE_IDEA"; payload: TileIdea }
  | { type: "UPDATE_TILE_IDEA"; payload: TileIdea }
  | { type: "DELETE_TILE_IDEA"; payload: { id: string } }
  | { type: "HYDRATE_FROM_STORAGE"; payload: TileIdea[] };

function tileIdeasReducer(
  state: TileIdea[],
  action: TileIdeasAction,
): TileIdea[] {
  switch (action.type) {
    case "HYDRATE_FROM_STORAGE":
      return action.payload;
    case "ADD_TILE_IDEA":
      return [...state, action.payload];
    case "UPDATE_TILE_IDEA":
      return state.map((tile) =>
        tile.id === action.payload.id ? { ...tile, ...action.payload } : tile,
      );
    case "DELETE_TILE_IDEA":
      return state.filter((tile) => tile.id !== action.payload.id);
    default:
      return state;
  }
}

const TileIdeasContext = createContext<any>(undefined);

const initialTileIdeas: TileIdea[] = [];

export function TileIdeasProvider({ children }: { children: ReactNode }) {
  const [tileIdeas, dispatch] = useLocalStorageReducer(
    tileIdeasReducer,
    initialTileIdeas,
    TILE_IDEAS_STORAGE_KEY,
    (loaded, initial) => (Array.isArray(loaded) ? loaded : initial),
  );
  const addTileIdea = (tileIdea: TileIdea) =>
    dispatch({ type: "ADD_TILE_IDEA", payload: tileIdea });
  const updateTileIdea = (tileIdea: TileIdea) =>
    dispatch({ type: "UPDATE_TILE_IDEA", payload: tileIdea });
  const deleteTileIdea = (id: string) =>
    dispatch({ type: "DELETE_TILE_IDEA", payload: { id } });
  const value = useMemo(
    () => ({ tileIdeas, addTileIdea, updateTileIdea, deleteTileIdea }),
    [tileIdeas],
  );
  return (
    <TileIdeasContext.Provider value={value}>
      {children}
    </TileIdeasContext.Provider>
  );
}

export function useTileIdeas() {
  const ctx = useContext(TileIdeasContext);
  if (!ctx)
    throw new Error("useTileIdeas must be used within a TileIdeasProvider");
  return ctx;
}
