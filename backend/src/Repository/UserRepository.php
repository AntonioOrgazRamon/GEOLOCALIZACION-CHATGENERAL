<?php

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
        }

        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }

    /**
     * Find users within a radius of 5 km from given coordinates
     * Uses Haversine formula
     *
     * @param float $latitude
     * @param float $longitude
     * @param int $excludeUserId
     * @param float $radiusKm
     * @return array
     */
    public function findUsersWithinRadius(float $latitude, float $longitude, int $excludeUserId, float $radiusKm = 5.0): array
    {
        $conn = $this->getEntityManager()->getConnection();

        $sql = "
            SELECT
                id,
                name,
                email,
                latitude,
                longitude,
                (
                    6371 * ACOS(
                        COS(RADIANS(:lat))
                        * COS(RADIANS(latitude))
                        * COS(RADIANS(longitude) - RADIANS(:lng))
                        + SIN(RADIANS(:lat))
                        * SIN(RADIANS(latitude))
                    )
                ) AS distance_km
            FROM users
            WHERE
                latitude IS NOT NULL
                AND longitude IS NOT NULL
                AND id != :user_id
                AND is_active = 1
            HAVING distance_km <= :radius
            ORDER BY distance_km ASC
        ";

        $result = $conn->executeQuery($sql, [
            'lat' => $latitude,
            'lng' => $longitude,
            'user_id' => $excludeUserId,
            'radius' => $radiusKm,
        ]);

        return $result->fetchAllAssociative();
    }
}

