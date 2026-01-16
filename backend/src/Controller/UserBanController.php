<?php

namespace App\Controller;

use App\Entity\BanAppeal;
use App\Repository\BanAppealRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/user', name: 'api_user_')]
#[IsGranted('ROLE_USER')]
class UserBanController extends AbstractController
{
    public function __construct(
        private BanAppealRepository $banAppealRepository,
        private EntityManagerInterface $entityManager
    ) {
    }

    #[Route('/ban-status', name: 'ban_status', methods: ['GET'])]
    public function getBanStatus(): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        if ($user->isBanned()) {
            return $this->json([
                'is_banned' => true,
                'ban_reason' => $user->getBanReason(),
                'banned_at' => $user->getBannedAt()?->format('Y-m-d H:i:s'),
            ]);
        }

        return $this->json([
            'is_banned' => false,
        ]);
    }

    #[Route('/ban-appeal', name: 'create_ban_appeal', methods: ['POST'])]
    public function createBanAppeal(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        if (!$user->isBanned()) {
            return $this->json(['error' => 'User is not banned'], Response::HTTP_BAD_REQUEST);
        }

        // Verificar si ya tiene una petición pendiente
        $existingAppeal = $this->banAppealRepository->findPendingByUser($user);
        if ($existingAppeal) {
            return $this->json([
                'error' => 'You already have a pending ban appeal',
                'appeal_id' => $existingAppeal->getId(),
            ], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);
        $message = $data['message'] ?? '';

        if (empty(trim($message))) {
            return $this->json(['error' => 'Message is required'], Response::HTTP_BAD_REQUEST);
        }

        $appeal = new BanAppeal();
        $appeal->setUser($user);
        $appeal->setMessage(trim($message));

        $this->entityManager->persist($appeal);
        $this->entityManager->flush();

        return $this->json([
            'message' => 'Ban appeal created successfully',
            'appeal' => [
                'id' => $appeal->getId(),
                'status' => $appeal->getStatus(),
                'created_at' => $appeal->getCreatedAt()->format('Y-m-d H:i:s'),
            ],
        ], Response::HTTP_CREATED);
    }
}
