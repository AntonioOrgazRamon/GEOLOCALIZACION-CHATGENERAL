<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * DESHABILITADO: Usando NelmioCorsBundle en su lugar
 * Este subscriber puede causar conflictos con NelmioCorsBundle
 */
class CorsSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        // Deshabilitado - usar NelmioCorsBundle
        return [];
    }
}

