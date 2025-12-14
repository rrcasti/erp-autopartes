<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\PurchaseOrder;

class PurchaseOrderSent extends Mailable
{
    use Queueable, SerializesModels;

    public $po;
    public $subjectText;
    public $customMessage;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct(PurchaseOrder $po, $subject, $message)
    {
        $this->po = $po;
        $this->subjectText = $subject;
        $this->customMessage = $message;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject($this->subjectText)
                    ->view('emails.purchase_order');
    }
}
