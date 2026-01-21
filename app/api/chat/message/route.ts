import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ChatMessageSchema } from '@/lib/validations';
import { requireAuth, unauthorizedResponse } from '@/lib/auth-helpers';
import { chatWithAI } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validatedData = ChatMessageSchema.parse(body);

    // Get or create conversation
    let conversation;
    if (validatedData.conversationId) {
      conversation = await db.chatConversation.findUnique({
        where: { id: validatedData.conversationId },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      if (conversation.userId !== user.id) {
        return unauthorizedResponse();
      }
    } else {
      // Create new conversation
      conversation = await db.chatConversation.create({
        data: {
          userId: user.id,
          title: validatedData.content.substring(0, 50) || null,
          status: 'ACTIVE',
        },
      });
    }

    // Save user message
    const userMessage = await db.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: validatedData.content,
      },
    });

    // Get conversation history for context
    const previousMessages = await db.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20, // Last 20 messages for context
    });

    // Prepare messages for OpenAI (exclude system messages)
    const openAIMessages = previousMessages.map((msg) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content,
    }));

    // Call OpenAI API
    let aiResponse: string;
    let planProposal = null;
    
    try {
      const result = await chatWithAI(openAIMessages, user.id);
      aiResponse = result.response;
      planProposal = result.planProposal || null;
    } catch (error) {
      console.error('OpenAI API error:', error);
      aiResponse = "I'm having trouble processing your request right now. Please try again.";
    }

    // Save AI message
    const aiMessage = await db.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: aiResponse,
        metadata: planProposal ? { planProposal } : undefined,
      },
    });

    // Update conversation with plan if proposal exists
    if (planProposal) {
      await db.chatConversation.update({
        where: { id: conversation.id },
        data: {
          plan: planProposal,
          updatedAt: new Date(),
        },
      });
    } else {
      await db.chatConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        status: conversation.status,
        plan: planProposal,
      },
      userMessage,
      aiMessage,
      planProposal,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error sending message:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
