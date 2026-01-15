<?php

namespace App\Controller;

use App\DTO\ChatMessageDTO;
use App\Service\ChatService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/chat', name: 'api_chat_')]
#[IsGranted('ROLE_USER')]
class ChatController extends AbstractController
{
    public function __construct(
        private ChatService $chatService,
        private SerializerInterface $serializer,
        private ValidatorInterface $validator
    ) {
    }

    #[Route('/message', name: 'send_message', methods: ['POST'])]
    public function sendMessage(Request $request): JsonResponse
    {
        try {
            /** @var \App\Entity\User $user */
            $user = $this->getUser();

            if (!$user) {
                return $this->json(['error' => 'User not authenticated'], Response::HTTP_UNAUTHORIZED);
            }

            $data = json_decode($request->getContent(), true);
            if (!isset($data['message']) || empty(trim($data['message']))) {
                return $this->json(['error' => 'Message is required'], Response::HTTP_BAD_REQUEST);
            }

            $chatMessage = $this->chatService->sendMessage($user, trim($data['message']));

            return $this->json([
                'id' => $chatMessage->getId(),
                'user_name' => $chatMessage->getUserName(),
                'message' => $chatMessage->getMessage(),
                'created_at' => $chatMessage->getCreatedAt()->format('Y-m-d H:i:s'),
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'An error occurred',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/join', name: 'join_chat', methods: ['POST'])]
    public function joinChat(): JsonResponse
    {
        try {
            /** @var \App\Entity\User $user */
            $user = $this->getUser();

            if (!$user) {
                return $this->json(['error' => 'User not authenticated'], Response::HTTP_UNAUTHORIZED);
            }

            // Verificar si el usuario ya tiene un mensaje de "se ha unido"
            $existingJoinMessage = $this->chatService->getUserJoinMessage($user);
            
            if ($existingJoinMessage) {
                // El usuario ya se unió antes, devolver ese mensaje
                return $this->json([
                    'id' => $existingJoinMessage->getId(),
                    'user_name' => $existingJoinMessage->getUserName(),
                    'message' => $existingJoinMessage->getMessage(),
                    'created_at' => $existingJoinMessage->getCreatedAt()->format('Y-m-d H:i:s'),
                    'already_joined' => true
                ]);
            }

            // Crear nuevo mensaje de "se ha unido" (esto también creará el mensaje de creación si es el primer usuario)
            $joinMessages = $this->chatService->sendJoinMessage($user);

            // Si es el primer usuario, sendJoinMessage devuelve un array con dos mensajes
            // Si no, devuelve solo el mensaje de unión
            if (is_array($joinMessages)) {
                // Es el primer usuario, devolver ambos mensajes
                return $this->json([
                    'messages' => [
                        [
                            'id' => $joinMessages[0]->getId(),
                            'user_name' => $joinMessages[0]->getUserName(),
                            'message' => $joinMessages[0]->getMessage(),
                            'created_at' => $joinMessages[0]->getCreatedAt()->format('Y-m-d H:i:s'),
                        ],
                        [
                            'id' => $joinMessages[1]->getId(),
                            'user_name' => $joinMessages[1]->getUserName(),
                            'message' => $joinMessages[1]->getMessage(),
                            'created_at' => $joinMessages[1]->getCreatedAt()->format('Y-m-d H:i:s'),
                        ]
                    ],
                    'already_joined' => false,
                    'is_first_user' => true
                ], Response::HTTP_CREATED);
            }

            // No es el primer usuario, devolver solo el mensaje de unión
            return $this->json([
                'id' => $joinMessages->getId(),
                'user_name' => $joinMessages->getUserName(),
                'message' => $joinMessages->getMessage(),
                'created_at' => $joinMessages->getCreatedAt()->format('Y-m-d H:i:s'),
                'already_joined' => false,
                'is_first_user' => false
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'An error occurred',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/messages', name: 'get_messages', methods: ['GET'])]
    public function getMessages(Request $request): JsonResponse
    {
        try {
            /** @var \App\Entity\User $user */
            $user = $this->getUser();

            // Usar el mensaje de "se ha unido" como referencia
            // Si el usuario tiene un mensaje de "se ha unido", solo mostrar mensajes desde ese momento
            $joinMessage = $this->chatService->getUserJoinMessage($user);
            
            if ($joinMessage) {
                // Usuario nuevo, solo mensajes desde que se unió
                $messages = $this->chatService->getMessagesSince($joinMessage->getCreatedAt());
            } else {
                // Usuario que ya estaba activo (sin mensaje de "se ha unido"), todos los mensajes
                $messages = $this->chatService->getAllMessages();
            }

            $messagesData = [];
            foreach ($messages as $message) {
                $messagesData[] = [
                    'id' => $message->getId(),
                    'user_name' => $message->getUserName(),
                    'message' => $message->getMessage(),
                    'created_at' => $message->getCreatedAt()->format('Y-m-d H:i:s'),
                ];
            }

            return $this->json([
                'messages' => $messagesData,
                'count' => count($messagesData),
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'An error occurred',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}

