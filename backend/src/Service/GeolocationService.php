<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

class GeolocationService
{
    public function __construct(
        private UserRepository $userRepository,
        private EntityManagerInterface $entityManager
    ) {
    }

    public function updateUserLocation(User $user, float $latitude, float $longitude): void
    {
        // Validate coordinates
        if ($latitude < -90 || $latitude > 90) {
            throw new \InvalidArgumentException('Latitude must be between -90 and 90');
        }

        if ($longitude < -180 || $longitude > 180) {
            throw new \InvalidArgumentException('Longitude must be between -180 and 180');
        }

        $user->setLatitude((string) $latitude);
        $user->setLongitude((string) $longitude);
        $user->setUpdatedAt(new \DateTime());

        $this->entityManager->flush();
    }

    public function findNearbyUsers(User $user, float $radiusKm = 5.0): array
    {
        if (!$user->getLatitude() || !$user->getLongitude()) {
            throw new \RuntimeException('User location is not set');
        }

        $results = $this->userRepository->findUsersWithinRadius(
            (float) $user->getLatitude(),
            (float) $user->getLongitude(),
            $user->getId(),
            $radiusKm
        );

        // Format results
        $formatted = [];
        foreach ($results as $result) {
            $formatted[] = [
                'id' => (int) $result['id'],
                'name' => $result['name'],
                'email' => $result['email'],
                'latitude' => $result['latitude'],
                'longitude' => $result['longitude'],
                'distance_km' => round((float) $result['distance_km'], 2),
            ];
        }

        return $formatted;
    }
}

