import { Link } from '@inertiajs/react';
import { Home } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { home } from '@/routes';

interface ErrorProps {
    status: number;
}

const messages: Record<number, { title: string; description: string }> = {
    403: { title: 'Forbidden', description: "You don't have permission to access this page." },
    404: { title: 'Page not found', description: "Sorry, we couldn't find the page you're looking for." },
    500: { title: 'Server error', description: 'Something went wrong on our end. Please try again later.' },
    503: { title: 'Service unavailable', description: 'We are down for maintenance. Please check back soon.' },
};

export default function ErrorPage({ status }: ErrorProps) {
    const { title, description } = messages[status] ?? {
        title: 'An error occurred',
        description: 'Something went wrong. Please try again.',
    };

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
            <p className="text-6xl font-bold text-muted-foreground/30">{status}</p>
            <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Button asChild>
                <Link href={home.url()}>
                    <Home className="mr-2 size-4" />
                    Back to home
                </Link>
            </Button>
        </div>
    );
}
