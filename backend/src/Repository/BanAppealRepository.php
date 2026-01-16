<?php

namespace App\Repository;

use App\Entity\BanAppeal;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<BanAppeal>
 */
class BanAppealRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BanAppeal::class);
    }

    /**
     * Obtener todas las peticiones pendientes
     */
    public function findPending(): array
    {
        return $this->createQueryBuilder('ba')
            ->where('ba.status = :status')
            ->setParameter('status', 'pending')
            ->orderBy('ba.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtener petición pendiente de un usuario
     */
    public function findPendingByUser($user): ?BanAppeal
    {
        $userId = is_object($user) && method_exists($user, 'getId') ? $user->getId() : $user;
        
        return $this->createQueryBuilder('ba')
            ->where('ba.user = :userId')
            ->andWhere('ba.status = :status')
            ->setParameter('userId', $userId)
            ->setParameter('status', 'pending')
            ->orderBy('ba.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
