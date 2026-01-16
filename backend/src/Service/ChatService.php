<?php

namespace App\Service;

use App\Entity\ChatMessage;
use App\Entity\User;
use App\Repository\ChatMessageRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

class ChatService
{
    public function __construct(
        private ChatMessageRepository $chatMessageRepository,
        private UserRepository $userRepository,
        private EntityManagerInterface $entityManager
    ) {
    }

    /**
     * Enviar un mensaje al chat
     */
    public function sendMessage(User $user, string $message): ChatMessage
    {
        $chatMessage = new ChatMessage();
        $chatMessage->setUser($user);
        $chatMessage->setUserName($user->getName());
        $chatMessage->setMessage($message);

        try {
            $this->entityManager->persist($chatMessage);
            $this->entityManager->flush();
        } catch (\Exception $e) {
            throw new \RuntimeException('Error saving message: ' . $e->getMessage(), 0, $e);
        }

        return $chatMessage;
    }

    /**
     * Enviar mensaje del sistema cuando un usuario se une al chat
     * @return ChatMessage|array Retorna ChatMessage si no es el primer usuario, o array de 2 mensajes si es el primero
     */
    public function sendJoinMessage(User $user): ChatMessage|array
    {
        // Verificar si es el primer mensaje del chat (chat recién creado)
        $totalMessages = $this->chatMessageRepository->countAllMessages();
        
        if ($totalMessages === 0) {
            // Es el primer usuario, enviar mensaje de creación del chat
            $systemMessage = new ChatMessage();
            $systemMessage->setUser($user);
            $systemMessage->setUserName('Sistema');
            $systemMessage->setMessage('Se ha creado el chatgeneral');

            try {
                $this->entityManager->persist($systemMessage);
                $this->entityManager->flush();
            } catch (\Exception $e) {
                throw new \RuntimeException('Error saving system message: ' . $e->getMessage(), 0, $e);
            }

            // Después de crear el mensaje del sistema, enviar el mensaje de unión del usuario
            $joinMessage = new ChatMessage();
            $joinMessage->setUser($user);
            $joinMessage->setUserName('Sistema');
            $joinMessage->setMessage($user->getName() . ' se ha unido al chat');
            
            try {
                $this->entityManager->persist($joinMessage);
                $this->entityManager->flush();
            } catch (\Exception $e) {
                throw new \RuntimeException('Error saving join message: ' . $e->getMessage(), 0, $e);
            }
            
            // Retornar ambos mensajes
            return [$systemMessage, $joinMessage];
        }
        
        // No es el primer usuario, solo enviar mensaje de unión
        // IMPORTANTE: Eliminar mensajes de "se ha unido" anteriores del usuario
        // para que solo se muestren mensajes desde este nuevo login
        $this->deletePreviousJoinMessages($user);
        
        $joinMessage = new ChatMessage();
        $joinMessage->setUser($user);
        $joinMessage->setUserName('Sistema');
        $joinMessage->setMessage($user->getName() . ' se ha unido al chat');
        
        try {
            $this->entityManager->persist($joinMessage);
            $this->entityManager->flush();
        } catch (\Exception $e) {
            throw new \RuntimeException('Error saving join message: ' . $e->getMessage(), 0, $e);
        }
        
        return $joinMessage;
    }

    /**
     * Obtener el mensaje de "se ha unido" más reciente de un usuario
     */
    public function getUserJoinMessage(User $user): ?ChatMessage
    {
        return $this->chatMessageRepository->findUserJoinMessage($user);
    }

    /**
     * Obtener mensajes desde una fecha específica (para usuarios que acaban de entrar)
     */
    public function getMessagesSince(\DateTimeInterface $since): array
    {
        return $this->chatMessageRepository->findMessagesSince($since);
    }

    /**
     * Obtener todos los mensajes (para usuarios que ya estaban activos)
     */
    public function getAllMessages(): array
    {
        return $this->chatMessageRepository->findAllOrdered();
    }

    /**
     * Verificar si hay usuarios activos y limpiar mensajes si no hay ninguno
     */
    private function checkAndCleanMessages(): void
    {
        $activeUsersCount = $this->chatMessageRepository->countActiveUsers();
        
        if ($activeUsersCount === 0) {
            // No hay usuarios activos, limpiar todos los mensajes
            $this->chatMessageRepository->deleteAllMessages();
        }
    }

    /**
     * Enviar mensaje del sistema cuando un usuario se sale del chat
     */
    public function sendLeaveMessage(User $user): ChatMessage
    {
        $leaveMessage = new ChatMessage();
        $leaveMessage->setUser($user);
        $leaveMessage->setUserName('Sistema');
        $leaveMessage->setMessage($user->getName() . ' se ha salido del chat');
        
        try {
            $this->entityManager->persist($leaveMessage);
            $this->entityManager->flush();
        } catch (\Exception $e) {
            throw new \RuntimeException('Error saving leave message: ' . $e->getMessage(), 0, $e);
        }
        
        return $leaveMessage;
    }

    /**
     * Limpiar mensajes cuando todos los usuarios están inactivos
     * Se llama cuando un usuario se desactiva
     */
    public function cleanMessagesIfNoActiveUsers(): void
    {
        $this->checkAndCleanMessages();
    }

    /**
     * Eliminar mensajes de "se ha unido" anteriores de un usuario
     * Esto asegura que solo se muestren mensajes desde el login más reciente
     */
    private function deletePreviousJoinMessages(User $user): void
    {
        $previousJoinMessages = $this->chatMessageRepository->createQueryBuilder('cm')
            ->where('cm.user = :userId')
            ->andWhere('cm.message LIKE :pattern')
            ->setParameter('userId', $user->getId())
            ->setParameter('pattern', '%se ha unido al chat%')
            ->getQuery()
            ->getResult();

        foreach ($previousJoinMessages as $message) {
            $this->entityManager->remove($message);
        }
        
        if (count($previousJoinMessages) > 0) {
            $this->entityManager->flush();
        }
    }
}

