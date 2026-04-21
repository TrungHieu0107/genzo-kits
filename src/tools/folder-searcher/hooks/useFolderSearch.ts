import { useState, useRef, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { LazyStore } from '@tauri-apps/plugin-store';

export interface SearchResultItem {
  path: string;
  name: string;
  base_path: string;
  modified: string;
  is_dir: boolean;
}

const store = new LazyStore('folder_searcher.json');

export function useFolderSearch() {
  const [rootDirs, setRootDirs] = useState<string[]>(['']);
  const [query, setQuery] = useState<string>('');
  const [mode, setMode] = useState<'all' | 'file' | 'folder'>('all');
  const [useRegex, setUseRegex] = useState<boolean>(false);
  const [useCache, setUseCache] = useState<boolean>(true);
  const [isOptionsCollapsed, setIsOptionsCollapsed] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // In-memory cache for search results
  const searchCache = useRef<Map<string, SearchResultItem[]>>(new Map());

  // Load persistence
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedRoots = await store.get<string[]>('rootDirs');
        const savedQuery = await store.get<string>('query');
        const savedMode = await store.get<'all' | 'file' | 'folder'>('mode');
        const savedRegex = await store.get<boolean>('useRegex');
        const savedUseCache = await store.get<boolean>('useCache');
        const savedOptionsCollapsed = await store.get<boolean>('isOptionsCollapsed');

        if (savedRoots && savedRoots.length > 0) {
          setRootDirs(savedRoots);
        } else {
          setRootDirs(['']);
        }
        if (savedQuery) setQuery(savedQuery);
        if (savedMode) setMode(savedMode);
        if (savedRegex !== undefined) setUseRegex(savedRegex);
        if (savedUseCache !== undefined) setUseCache(savedUseCache);
        if (savedOptionsCollapsed !== undefined) setIsOptionsCollapsed(savedOptionsCollapsed);
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsInitialLoad(false);
      }
    };
    loadSettings();
  }, []);

  // Save persistence (debounced)
  useEffect(() => {
    if (isInitialLoad) return;

    const saveTimeout = setTimeout(async () => {
      try {
        await store.set('rootDirs', rootDirs);
        await store.set('query', query);
        await store.set('mode', mode);
        await store.set('useRegex', useRegex);
        await store.set('useCache', useCache);
        await store.set('isOptionsCollapsed', isOptionsCollapsed);
        await store.save();
      } catch (err) {
        console.error("Failed to save settings:", err);
      }
    }, 500);

    return () => clearTimeout(saveTimeout);
  }, [rootDirs, query, mode, useRegex, useCache, isOptionsCollapsed, isInitialLoad]);

  const performBackendSearch = async (cacheKey: string): Promise<SearchResultItem[]> => {
    const found: SearchResultItem[] = await invoke('search_system', { 
      roots: rootDirs.filter(r => r.trim() !== ''),
      query: query.trim(),
      mode: mode,
      useRegex: useRegex 
    });
    const data = found || [];
    searchCache.current.set(cacheKey, data);
    return data;
  };

  const handleSearch = async (forceRefresh: boolean = false) => {
    if (!query.trim()) return;

    const cacheKey = JSON.stringify({
      roots: rootDirs.filter(r => r.trim() !== ''),
      query: query.trim(),
      mode,
      useRegex
    });

    if (!forceRefresh && useCache && searchCache.current.has(cacheKey)) {
      setResults(searchCache.current.get(cacheKey) || []);
      setHasSearched(true);
      setIsCached(true);
      setErrorMsg(null);
      setIsRevalidating(true);
      try {
        const freshData = await performBackendSearch(cacheKey);
        setResults(freshData);
        setIsCached(false);
      } catch (err: unknown) {
        console.error("Background refresh failed:", err);
      } finally {
        setIsRevalidating(false);
      }
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setResults([]);
    setIsCached(false);
    setErrorMsg(null);

    try {
      const data = await performBackendSearch(cacheKey);
      setResults(data);
    } catch (err: unknown) {
      console.error("Search failed:", err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSearching(false);
    }
  };

  return {
    rootDirs, setRootDirs,
    query, setQuery,
    mode, setMode,
    useRegex, setUseRegex,
    useCache, setUseCache,
    isOptionsCollapsed, setIsOptionsCollapsed,
    results, setResults,
    isSearching,
    isRevalidating,
    hasSearched,
    errorMsg,
    isCached,
    handleSearch
  };
}
