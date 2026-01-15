<?php

namespace App\Repository;

use App\Entity\ChatMessage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ChatMessage>
 */
class ChatMessageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ChatMessage::class);
    }

    /**
     * Obtener mensajes desde una fecha específica
     */
    public function findMessagesSince(\DateTimeInterface $since): array
    {
        return $this->createQueryBuilder('cm')
            ->where('cm.createdAt >= :since')
            ->setParameter('since', $since)
            ->orderBy('cm.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtener mensajes desde el mensaje de "se ha unido" de un usuario
     */
    public function findMessagesSinceUserJoin(int $userId): array
    {
        // Buscar el mensaje de "se ha unido" más reciente del usuario
        $joinMessage = $this->createQueryBuilder('cm')
            ->where('cm.user = :userId')
            ->andWhere('cm.message LIKE :pattern')
            ->setParameter('userId', $userId)
            ->setParameter('pattern', '%se ha unido al chat%')
            ->orderBy('cm.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        if ($joinMessage) {
            // Obtener todos los mensajes desde ese momento
            return $this->createQueryBuilder('cm')
                ->where('cm.createdAt >= :since')
                ->setParameter('since', $joinMessage->getCreatedAt())
                ->orderBy('cm.createdAt', 'ASC')
                ->getQuery()
                ->getResult();
        }

        // Si no hay mensaje de "se ha unido", devolver todos los mensajes
        return $this->findAllOrdered();
    }

    /**
     * Buscar el mensaje de "se ha unido" de un usuario
     */
    public function findUserJoinMessage($user): ?ChatMessage
    {
        // Aceptar tanto User entity como ID
        $userId = is_object($user) && method_exists($user, 'getId') ? $user->getId() : $user;
        
        return $this->createQueryBuilder('cm')
            ->where('cm.user = :userId')
            ->andWhere('cm.message LIKE :pattern')
            ->setParameter('userId', $userId)
            ->setParameter('pattern', '%se ha unido al chat%')
            ->orderBy('cm.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Obtener todos los mensajes ordenados por fecha
     */
    public function findAllOrdered(): array
    {
        return $this->createQueryBuilder('cm')
            ->orderBy('cm.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Contar el total de mensajes en el chat
     */
    public function countAllMessages(): int
    {
        return $this->createQueryBuilder('cm')
            ->select('COUNT(cm.id)')
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Contar usuarios activos
     */
    public function countActiveUsers(): int
    {
        $conn = $this->getEntityManager()->getConnection();
        
        try {
            $sql = "SELECT COUNT(*) as count 
                    FROM users 
                    WHERE is_active = 1 
                    AND latitude IS NOT NULL 
                    AND longitude IS NOT NULL";
            
            $result = $conn->executeQuery($sql);
            $row = $result->fetchAssociative();
            
            return (int) ($row['count'] ?? 0);
        } catch (\Exception $e) {
            // Si hay error, asumir que hay al menos 1 usuario activo
            return 1;
        }
    }

    /**
     * Eliminar todos los mensajes
     */
    public function deleteAllMessages(): void
    {
        $this->createQueryBuilder('cm')
            ->delete()
            ->getQuery()
            ->execute();
    }
}

