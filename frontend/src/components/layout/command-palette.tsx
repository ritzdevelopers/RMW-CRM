'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Building2, UserCog, Clock, LayoutDashboard, Plus, ArrowRight } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { apiGet } from '@/lib/api';
import { useUIStore } from '@/lib/ui-store';
import { LEAD_STATUS_META } from '@/lib/constants';
import { useQuery } from '@/lib/simple-query';

interface SearchResults {
  leads: { id: number; name: string; phone: string; email?: string; status: keyof typeof LEAD_STATUS_META }[];
  builders: { id: number; name: string; city?: string; status: string }[];
  users: { id: number; name: string; email: string; role: string }[];
}

const RECENT_KEY = 'mpf.recentSearches';

function getRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}
function pushRecent(term: string) {
  const list = [term, ...getRecent().filter((t) => t !== term)].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

function useDebounced<T>(value: T, delay = 250): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useUIStore();
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const debounced = useDebounced(query, 250);
  const [recent, setRecent] = React.useState<string[]>([]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandOpen, setCommandOpen]);

  React.useEffect(() => {
    if (commandOpen) setRecent(getRecent());
  }, [commandOpen]);

  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => apiGet<SearchResults>(`/search?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.trim().length >= 2,
  });

  const go = (path: string) => {
    if (debounced.trim().length >= 2) pushRecent(debounced.trim());
    setCommandOpen(false);
    setQuery('');
    router.push(path);
  };

  const hasResults = data && (data.leads.length || data.builders.length || data.users.length);

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Search leads, builders, people…  or jump to a page" value={query} onValueChange={setQuery} />
      <CommandList>
        {!query && (
          <>
            <CommandGroup heading="Quick actions">
              <CommandItem onSelect={() => go('/leads?new=1')}>
                <Plus /> Create a new lead
              </CommandItem>
              <CommandItem onSelect={() => go('/builders?new=1')}>
                <Plus /> Add a builder
              </CommandItem>
              <CommandItem onSelect={() => go('/dashboard')}>
                <LayoutDashboard /> Go to Dashboard
              </CommandItem>
            </CommandGroup>
            {recent.length > 0 && (
              <CommandGroup heading="Recent searches">
                {recent.map((r) => (
                  <CommandItem key={r} onSelect={() => setQuery(r)}>
                    <Clock className="text-muted-foreground" /> {r}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}

        {query.trim().length >= 2 && (
          <>
            {isFetching && !hasResults && <div className="py-6 text-center text-sm text-muted-foreground">Searching…</div>}
            {!isFetching && !hasResults && <CommandEmpty>No results for “{query}”.</CommandEmpty>}

            {data && data.leads.length > 0 && (
              <CommandGroup heading="Leads">
                {data.leads.map((l) => (
                  <CommandItem key={`lead-${l.id}`} value={`lead-${l.id}-${l.name}`} onSelect={() => go(`/leads/${l.id}`)}>
                    <Users className="text-muted-foreground" />
                    <span className="flex-1 truncate">
                      <Highlight text={l.name} query={query} /> <span className="text-muted-foreground">· {l.phone}</span>
                    </span>
                    <Badge variant={LEAD_STATUS_META[l.status]?.variant ?? 'secondary'}>
                      {LEAD_STATUS_META[l.status]?.label ?? l.status}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {data && data.builders.length > 0 && (
              <CommandGroup heading="Builders">
                {data.builders.map((b) => (
                  <CommandItem key={`builder-${b.id}`} value={`builder-${b.id}-${b.name}`} onSelect={() => go(`/builders?highlight=${b.id}`)}>
                    <Building2 className="text-muted-foreground" />
                    <span className="flex-1 truncate">
                      <Highlight text={b.name} query={query} />{' '}
                      {b.city && <span className="text-muted-foreground">· {b.city}</span>}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {data && data.users.length > 0 && (
              <CommandGroup heading="People">
                {data.users.map((u) => (
                  <CommandItem key={`user-${u.id}`} value={`user-${u.id}-${u.name}`} onSelect={() => go('/users')}>
                    <UserCog className="text-muted-foreground" />
                    <span className="flex-1 truncate">
                      <Highlight text={u.name} query={query} /> <span className="text-muted-foreground">· {u.email}</span>
                    </span>
                    <Badge variant="outline">{u.role}</Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-primary/20 text-foreground">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}
