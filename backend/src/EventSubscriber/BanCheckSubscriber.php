<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

class BanCheckSubscriber implements EventSubscriberInterface
{
    private array $publicPaths = [
        '/api/login',
        '/api/register',
        '/api/refresh',
        '/api/user/ban-status', // Permitir verificar ban status incluso si está baneado
        '/api/user/ban-appeal', // Permitir crear ban appeal incluso si está baneado
    ];

    public function __construct(
        private TokenStorageInterface $tokenStorage
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 10],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();
        $path = $request->getPathInfo();

        // Permitir rutas públicas
        foreach ($this->publicPaths as $publicPath) {
            if (str_starts_with($path, $publicPath)) {
                return;
            }
        }

        // Solo verificar si hay un usuario autenticado
        $token = $this->tokenStorage->getToken();
        if (!$token || !$token->getUser()) {
            return;
        }

        $user = $token->getUser();

        // Si el usuario es admin, permitir acceso a rutas de admin
        if (in_array('ROLE_ADMIN', $user->getRoles()) && str_starts_with($path, '/api/admin')) {
            return;
        }

        // Verificar si el usuario está baneado
        if (method_exists($user, 'isBanned') && $user->isBanned()) {
            // Permitir acceso a rutas de ban appeal y ban-status (ya están en publicPaths, pero por si acaso)
            if (str_starts_with($path, '/api/user/ban-appeal') || str_starts_with($path, '/api/user/ban-status')) {
                return;
            }

            $event->setResponse(new JsonResponse([
                'error' => 'You have been banned',
                'ban_reason' => method_exists($user, 'getBanReason') ? $user->getBanReason() : 'No reason provided',
                'banned_at' => method_exists($user, 'getBannedAt') && $user->getBannedAt() 
                    ? $user->getBannedAt()->format('Y-m-d H:i:s') 
                    : null,
            ], 403));
        }
    }
}
