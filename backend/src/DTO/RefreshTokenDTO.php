<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class RefreshTokenDTO
{
    #[Assert\NotBlank]
    public ?string $refresh_token = null;
}

