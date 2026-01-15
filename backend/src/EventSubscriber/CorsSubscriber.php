<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class CorsSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            // Use higher priority to run before security and other listeners
            KernelEvents::REQUEST => ['onKernelRequest', 256],
            KernelEvents::RESPONSE => ['onKernelResponse', 256],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();

        // Only handle API requests
        if (strpos($request->getPathInfo(), '/api/') !== 0) {
            return;
        }

        // Handle preflight OPTIONS requests
        if ($request->getMethod() === 'OPTIONS') {
            $origin = $request->headers->get('Origin');
            
            // Check if origin is allowed
            $allowed = false;
            if ($origin && preg_match('#^http://localhost:\d+$#', $origin)) {
                $allowed = true;
            }
            if ($origin && preg_match('#^https://demo\.nakedcode\.es$#', $origin)) {
                $allowed = true;
            }

            if ($allowed) {
                $response = new Response();
                $response->headers->set('Access-Control-Allow-Origin', $origin);
                $response->headers->set('Access-Control-Allow-Credentials', 'true');
                $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
                $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
                $response->headers->set('Access-Control-Max-Age', '3600');
                $response->setStatusCode(200);
                $response->setContent('');
                
                $event->setResponse($response);
                $event->stopPropagation();
            }
        }
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        $request = $event->getRequest();
        $response = $event->getResponse();

        // Only handle API requests
        if (strpos($request->getPathInfo(), '/api/') !== 0) {
            return;
        }

        $origin = $request->headers->get('Origin');
        
        // Allow localhost origins
        if ($origin && preg_match('#^http://localhost:\d+$#', $origin)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
            $response->headers->set('Access-Control-Max-Age', '3600');
        }
        
        // Allow production domain
        if ($origin && preg_match('#^https://demo\.nakedcode\.es$#', $origin)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
            $response->headers->set('Access-Control-Max-Age', '3600');
        }
    }
}

