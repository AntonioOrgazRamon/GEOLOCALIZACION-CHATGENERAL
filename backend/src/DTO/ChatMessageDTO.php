<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class ChatMessageDTO
{
    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 1000)]
    public ?string $message = null;
}

