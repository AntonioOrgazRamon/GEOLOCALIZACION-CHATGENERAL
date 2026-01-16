<?php

namespace App\Controller;

use App\Entity\BanAppeal;
use App\Entity\User;
use App\Repository\BanAppealRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin', name: 'api_admin_')]
#[IsGranted('ROLE_ADMIN')]
class AdminController extends AbstractController
{
    public function __construct(
        private UserRepository $userRepository,
        private BanAppealRepository $banAppealRepository,
        private EntityManagerInterface $entityManager
    ) {
    }

    #[Route('/users', name: 'list_users', methods: ['GET'])]
    public function listUsers(): JsonResponse
    {
        $users = $this->userRepository->findAll();
        
        $usersData = [];
        foreach ($users as $user) {
            $usersData[] = [
                'id' => $user->getId(),
                'name' => $user->getName(),
                'email' => $user->getEmail(),
                'latitude' => $user->getLatitude(),
                'longitude' => $user->getLongitude(),
                'is_active' => $user->isActive(),
                'is_admin' => $user->isAdmin(),
                'is_banned' => $user->isBanned(),
                'ban_reason' => $user->getBanReason(),
                'banned_at' => $user->getBannedAt()?->format('Y-m-d H:i:s'),
                'created_at' => $user->getCreatedAt()?->format('Y-m-d H:i:s'),
            ];
        }

        return $this->json([
            'users' => $usersData,
            'count' => count($usersData),
        ]);
    }

    #[Route('/users/{id}/ban', name: 'ban_user', methods: ['POST'])]
    public function banUser(int $id, Request $request): JsonResponse
    {
        $user = $this->userRepository->find($id);
        
        if (!$user) {
            return $this->json(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $reason = $data['reason'] ?? 'No reason provided';

        $user->setIsBanned(true);
        $user->setBanReason($reason);
        $user->setIsActive(false); // También desactivar

        $this->entityManager->flush();

        return $this->json([
            'message' => 'User banned successfully',
            'user' => [
                'id' => $user->getId(),
                'is_banned' => $user->isBanned(),
                'ban_reason' => $user->getBanReason(),
            ],
        ]);
    }

    #[Route('/users/{id}/unban', name: 'unban_user', methods: ['POST'])]
    public function unbanUser(int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);
        
        if (!$user) {
            return $this->json(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        $user->setIsBanned(false);
        $user->setBanReason(null);
        $user->setBannedAt(null);

        // Rechazar todas las peticiones pendientes de este usuario
        $pendingAppeals = $this->banAppealRepository->findPendingByUser($user);
        if ($pendingAppeals) {
            $pendingAppeals->setStatus('rejected');
            $pendingAppeals->setReviewedBy($this->getUser());
        }

        $this->entityManager->flush();

        return $this->json([
            'message' => 'User unbanned successfully',
            'user' => [
                'id' => $user->getId(),
                'is_banned' => $user->isBanned(),
            ],
        ]);
    }

    #[Route('/ban-appeals', name: 'list_ban_appeals', methods: ['GET'])]
    public function listBanAppeals(): JsonResponse
    {
        $appeals = $this->banAppealRepository->findPending();
        
        $appealsData = [];
        foreach ($appeals as $appeal) {
            $appealsData[] = [
                'id' => $appeal->getId(),
                'user_id' => $appeal->getUser()->getId(),
                'user_name' => $appeal->getUser()->getName(),
                'user_email' => $appeal->getUser()->getEmail(),
                'message' => $appeal->getMessage(),
                'status' => $appeal->getStatus(),
                'created_at' => $appeal->getCreatedAt()->format('Y-m-d H:i:s'),
                'ban_reason' => $appeal->getUser()->getBanReason(),
            ];
        }

        return $this->json([
            'appeals' => $appealsData,
            'count' => count($appealsData),
        ]);
    }

    #[Route('/ban-appeals/{id}/approve', name: 'approve_ban_appeal', methods: ['POST'])]
    public function approveBanAppeal(int $id): JsonResponse
    {
        $appeal = $this->banAppealRepository->find($id);
        
        if (!$appeal) {
            return $this->json(['error' => 'Ban appeal not found'], Response::HTTP_NOT_FOUND);
        }

        if ($appeal->getStatus() !== 'pending') {
            return $this->json(['error' => 'Ban appeal already processed'], Response::HTTP_BAD_REQUEST);
        }

        $user = $appeal->getUser();
        $user->setIsBanned(false);
        $user->setBanReason(null);
        $user->setBannedAt(null);

        $appeal->setStatus('approved');
        $appeal->setReviewedBy($this->getUser());

        $this->entityManager->flush();

        return $this->json([
            'message' => 'Ban appeal approved, user unbanned',
            'user' => [
                'id' => $user->getId(),
                'is_banned' => $user->isBanned(),
            ],
        ]);
    }

    #[Route('/ban-appeals/{id}/reject', name: 'reject_ban_appeal', methods: ['POST'])]
    public function rejectBanAppeal(int $id): JsonResponse
    {
        $appeal = $this->banAppealRepository->find($id);
        
        if (!$appeal) {
            return $this->json(['error' => 'Ban appeal not found'], Response::HTTP_NOT_FOUND);
        }

        if ($appeal->getStatus() !== 'pending') {
            return $this->json(['error' => 'Ban appeal already processed'], Response::HTTP_BAD_REQUEST);
        }

        $appeal->setStatus('rejected');
        $appeal->setReviewedBy($this->getUser());

        $this->entityManager->flush();

        return $this->json([
            'message' => 'Ban appeal rejected',
        ]);
    }
}
