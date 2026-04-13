import { Head, router, usePage } from '@inertiajs/react';
import { CheckCheck, Clock, Search, ShieldAlert, ShieldCheck, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type Role = 'viewer' | 'editor_pending' | 'editor' | 'admin';

interface UserRow {
    id: number;
    name: string;
    email: string;
    role: Role;
    created_at: string;
    last_login_at: string | null;
}

interface AdminUsersProps {
    users: UserRow[];
    pendingCount: number;
    search: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/users' },
    { title: 'Users', href: '/admin/users' },
];

const roleLabels: Record<Role, string> = {
    viewer: 'Viewer',
    editor_pending: 'Editor (Pending)',
    editor: 'Editor',
    admin: 'Admin',
};

function formatDate(iso: string | null): string {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

const roleBadge = (role: Role) => {
    switch (role) {
        case 'admin':
            return <Badge className="bg-red-500 text-white"><ShieldAlert className="mr-1 size-3" />Admin</Badge>;
        case 'editor':
            return <Badge className="bg-blue-500 text-white"><ShieldCheck className="mr-1 size-3" />Editor</Badge>;
        case 'editor_pending':
            return <Badge className="bg-amber-500 text-white"><Clock className="mr-1 size-3" />Pending</Badge>;
        default:
            return <Badge variant="secondary"><User className="mr-1 size-3" />Viewer</Badge>;
    }
};

export default function AdminUsers({ users, pendingCount, search: initialSearch }: AdminUsersProps) {
    const { name } = usePage<SharedData>().props;
    const [search, setSearch] = useState(initialSearch);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setSearch(initialSearch);
    }, [initialSearch]);

    const handleSearch = (value: string) => {
        setSearch(value);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get('/admin/users', { search: value || undefined }, { preserveState: true, replace: true });
        }, 300);
    };

    const updateRole = (userId: number, role: Role) => {
        router.patch(`/admin/users/${userId}/role`, { role }, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`User Management | ${name}`} />

            <div className="mx-auto max-w-4xl p-4 lg:p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage user roles and editor access requests.
                    </p>
                </div>

                {pendingCount > 0 && (
                    <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400">
                                <Clock className="size-4" />
                                {pendingCount} Editor Access Request{pendingCount > 1 ? 's' : ''} Pending
                            </CardTitle>
                            <CardDescription className="text-amber-600 dark:text-amber-500">
                                Review the pending requests below and approve or deny editor access.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle>All Users ({users.length})</CardTitle>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    ref={inputRef}
                                    placeholder="Search by name or email…"
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className={`flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between ${
                                        user.role === 'editor_pending' ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''
                                    }`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate font-medium">{user.name}</p>
                                            {roleBadge(user.role)}
                                        </div>
                                        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                                        <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                                            <span>Joined {formatDate(user.created_at)}</span>
                                            <span>Last login {formatDate(user.last_login_at)}</span>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                        <Select
                                            value={user.role}
                                            onValueChange={(v) => updateRole(user.id, v as Role)}
                                        >
                                            <SelectTrigger className="w-40">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(Object.entries(roleLabels) as [Role, string][]).map(([value, label]) => (
                                                    <SelectItem key={value} value={value}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {user.role === 'editor_pending' && (
                                            <Button
                                                size="sm"
                                                className="shrink-0"
                                                onClick={() => updateRole(user.id, 'editor')}
                                            >
                                                <CheckCheck className="mr-1.5 size-3.5" />
                                                Approve
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
