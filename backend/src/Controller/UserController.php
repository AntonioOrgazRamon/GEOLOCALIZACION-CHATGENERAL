<?php

namespace App\Controller;

use App\DTO\LocationDTO;
use App\Service\GeolocationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/users', name: 'api_users_')]
#[IsGranted('ROLE_USER')]
class UserController extends AbstractController
{
    public function __construct(
        private GeolocationService $geolocationService,
        private SerializerInterface $serializer,
        private ValidatorInterface $validator,
        private EntityManagerInterface $entityManager
    ) {
    }

    #[Route('/me/location', name: 'update_location', methods: ['PUT'])]
    public function updateLocation(Request $request): JsonResponse
    {
        try {
            /** @var \App\Entity\User $user */
            $user = $this->getUser();

            $dto = $this->serializer->deserialize($request->getContent(), LocationDTO::class, 'json');
            
            $errors = $this->validator->validate($dto);
            if (count($errors) > 0) {
                return $this->json(['errors' => (string) $errors], Response::HTTP_BAD_REQUEST);
            }

            $this->geolocationService->updateUserLocation(
                $user,
                $dto->latitude,
                $dto->longitude
            );

            return $this->json([
                'message' => 'Location updated successfully',
                'latitude' => $user->getLatitude(),
                'longitude' => $user->getLongitude(),
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return $this->json(['error' => 'An error occurred'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/nearby', name: 'nearby', methods: ['GET'])]
    public function getNearbyUsers(): JsonResponse
    {
        try {
            /** @var \App\Entity\User $user */
            $user = $this->getUser();

            // Refrescar la entidad desde la base de datos para obtener los datos más recientes
            $this->entityManager->refresh($user);

            // Verificar que el usuario tenga ubicación
            if (!$user->getLatitude() || !$user->getLongitude()) {
                return $this->json([
                    'error' => 'User location is not set',
                    'debug' => [
                        'user_id' => $user->getId(),
                        'has_latitude' => $user->getLatitude() !== null,
                        'has_longitude' => $user->getLongitude() !== null,
                    ]
                ], Response::HTTP_BAD_REQUEST);
            }

            $nearbyUsers = $this->geolocationService->findNearbyUsers($user);

            return $this->json([
                'users' => $nearbyUsers,
                'count' => count($nearbyUsers),
            ]);
        } catch (\RuntimeException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'An error occurred',
                'message' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}

