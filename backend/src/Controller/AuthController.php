<?php

namespace App\Controller;

use App\DTO\LoginDTO;
use App\DTO\RefreshTokenDTO;
use App\DTO\RegisterDTO;
use App\Service\AuthService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api', name: 'api_')]
class AuthController extends AbstractController
{
    public function __construct(
        private AuthService $authService,
        private SerializerInterface $serializer,
        private ValidatorInterface $validator
    ) {
    }

    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        try {
            $dto = $this->serializer->deserialize($request->getContent(), RegisterDTO::class, 'json');
            
            $errors = $this->validator->validate($dto);
            if (count($errors) > 0) {
                return $this->json(['errors' => (string) $errors], Response::HTTP_BAD_REQUEST);
            }

            $user = $this->authService->register(
                $dto->name,
                $dto->email,
                $dto->password
            );

            return $this->json([
                'message' => 'User registered successfully',
                'user' => [
                    'id' => $user->getId(),
                    'name' => $user->getName(),
                    'email' => $user->getEmail(),
                ],
            ], Response::HTTP_CREATED);
        } catch (\RuntimeException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return $this->json(['error' => 'An error occurred'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        try {
            $dto = $this->serializer->deserialize($request->getContent(), LoginDTO::class, 'json');
            
            $errors = $this->validator->validate($dto);
            if (count($errors) > 0) {
                return $this->json(['errors' => (string) $errors], Response::HTTP_BAD_REQUEST);
            }

            $result = $this->authService->login($dto->email, $dto->password);

            return $this->json([
                'token' => $result['token'],
                'refresh_token' => $result['refresh_token'],
                'user' => [
                    'id' => $result['user']->getId(),
                    'name' => $result['user']->getName(),
                    'email' => $result['user']->getEmail(),
                ],
            ]);
        } catch (\Symfony\Component\Security\Core\Exception\AuthenticationException $e) {
            return $this->json(['error' => 'Invalid credentials', 'message' => $e->getMessage()], Response::HTTP_UNAUTHORIZED);
        } catch (\Exception $e) {
            return $this->json(['error' => 'An error occurred', 'message' => $e->getMessage(), 'trace' => $e->getTraceAsString()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/logout', name: 'logout', methods: ['POST'])]
    public function logout(Request $request): JsonResponse
    {
        try {
            $dto = $this->serializer->deserialize($request->getContent(), RefreshTokenDTO::class, 'json');
            
            $errors = $this->validator->validate($dto);
            if (count($errors) > 0) {
                return $this->json(['errors' => (string) $errors], Response::HTTP_BAD_REQUEST);
            }

            $this->authService->logout($dto->refresh_token);

            return $this->json(['message' => 'Logged out successfully']);
        } catch (\Exception $e) {
            return $this->json(['error' => 'An error occurred'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/refresh', name: 'refresh', methods: ['POST'])]
    public function refresh(Request $request): JsonResponse
    {
        try {
            $dto = $this->serializer->deserialize($request->getContent(), RefreshTokenDTO::class, 'json');
            
            $errors = $this->validator->validate($dto);
            if (count($errors) > 0) {
                return $this->json(['errors' => (string) $errors], Response::HTTP_BAD_REQUEST);
            }

            $result = $this->authService->refreshAccessToken($dto->refresh_token);

            return $this->json([
                'token' => $result['token'],
                'refresh_token' => $result['refresh_token'],
                'user' => [
                    'id' => $result['user']->getId(),
                    'name' => $result['user']->getName(),
                    'email' => $result['user']->getEmail(),
                ],
            ]);
        } catch (\Symfony\Component\Security\Core\Exception\AuthenticationException $e) {
            return $this->json(['error' => 'Invalid refresh token'], Response::HTTP_UNAUTHORIZED);
        } catch (\Exception $e) {
            return $this->json(['error' => 'An error occurred'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}

