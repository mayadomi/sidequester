<?php

use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\EnsureUserIsEditor;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecureHeaders;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'editor' => EnsureUserIsEditor::class,
            'admin' => EnsureUserIsAdmin::class,
        ]);

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            SecureHeaders::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $dbUnavailable = fn () => response()->view('errors.service-unavailable', [], 503);

        $exceptions->render(function (QueryException $e) use ($dbUnavailable) {
            if (str_contains($e->getMessage(), 'could not connect')
                || str_contains($e->getMessage(), 'Connection refused')
                || str_contains($e->getMessage(), 'could not translate host name')
                || str_contains($e->getMessage(), 'SQLSTATE[08')
            ) {
                return $dbUnavailable();
            }
        });

        $exceptions->render(function (\PDOException $e) use ($dbUnavailable) {
            return $dbUnavailable();
        });

        $exceptions->render(function (HttpException $e, Request $request) {
            $status = $e->getStatusCode();

            if (in_array($status, [403, 404])) {
                return Inertia::render('error', ['status' => $status])
                    ->toResponse($request)
                    ->setStatusCode($status);
            }
        });
    })->create();
