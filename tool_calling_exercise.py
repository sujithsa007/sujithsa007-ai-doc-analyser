"""
🔧 **Tool Calling Exercise - From ReAct Prompting to Modern Tool Calling**

Welcome to the LangChain Tool Calling Exercise! 🚀

In this exercise, you'll modernize a ReAct agent by replacing prompt-based tool selection 
with native LLM tool calling capabilities. This represents the evolution from manual 
prompting to vendor-optimized tool calling.

**Your Mission:**
- Replace the ReAct prompt template with `.bind_tools()` 
- Handle tool calls from model responses directly
- Create a cleaner, more reliable agent loop

**Functions to Implement:**
All functions starting with `implement_` need your implementation!

Note: This uses simulated LangChain classes since third-party packages aren't allowed in Udemy exercises.
The API is identical to real LangChain, so this code transfers directly to production!
"""

import os
from typing import List, Any, Dict

# LangChain-compatible classes (simulated for exercise)
class Tool:
    """Tool class simulating LangChain's @tool decorator."""
    def __init__(self, name: str, description: str, func):
        self.name = name
        self.description = description
        self.func = func
    
    def invoke(self, input_data):
        return self.func(input_data)

class AIMessage:
    """AI message response with tool calling capabilities."""
    def __init__(self, content: str = "", tool_calls: List[Dict] = None):
        self.content = content
        self.tool_calls = tool_calls or []

class ChatOpenAI:
    """ChatOpenAI class with tool calling capabilities."""
    def __init__(self, temperature=0, model="gpt-3.5-turbo"):
        self.temperature = temperature
        self.model = model
        self.tools = []
    
    def bind_tools(self, tools):
        """Bind tools to the model for tool calling."""
        self.tools = tools
        return self
    
    def invoke(self, messages):
        """Mock invoke that simulates tool calling behavior."""
        if isinstance(messages, str):
            user_input = messages
        elif isinstance(messages, list) and len(messages) > 0:
            user_input = messages[-1].get('content', '') if isinstance(messages[-1], dict) else str(messages[-1])
        else:
            user_input = ""
        
        # Simulate tool calling decision based on input
        if "length" in user_input.lower() and "dog" in user_input.lower():
            return AIMessage(
                content="",  # Empty content when making tool calls (like real OpenAI API)
                tool_calls=[{
                    'name': 'get_text_length',
                    'args': {'text': 'DOG'},
                    'id': 'call_123',
                    'type': 'tool_call'
                }]
            )
        elif "length" in user_input.lower():
            # Extract text from user input for length calculation
            import re
            # Try multiple patterns to extract the word
            patterns = [
                r'length.*?(?:of|for).*?["\']([^"\']+)["\']',  # quoted text
                r'length.*?(?:of|for).*?(?:word|text).*?:\s*([A-Za-z]+)',  # word: WORD  
                r'length.*?(?:of|for).*?(?:word|text)\s+([A-Za-z]+)',  # word WORD
                r'(?:word|text)\s*:\s*([A-Za-z]+)',  # word: WORD
                r'length.*?:\s*([A-Za-z]+)',  # length: WORD
                r'\b([A-Z]+)\b',  # any uppercase word (fallback for DOG)
            ]
            
            text = "unknown"
            for pattern in patterns:
                text_match = re.search(pattern, user_input, re.IGNORECASE)
                if text_match:
                    text = text_match.group(1)
                    break
            
            return AIMessage(
                content="",  # Empty content when making tool calls (like real OpenAI API)
                tool_calls=[{
                    'name': 'get_text_length',
                    'args': {'text': text},
                    'id': 'call_124',
                    'type': 'tool_call'
                }]
            )

        else:
            return AIMessage(content="I can help you with text length calculations!")

# Tool definition (already provided for students)
def get_text_length(text: str) -> int:
    """Returns the length of a text by characters"""
    print(f"🔍 get_text_length called with text: {text}")
    text = text.strip("'\n").strip('"')  # Clean the text
    return len(text)

# Create tool instance (provided for students)
text_length_tool = Tool(
    name="get_text_length",
    description="Returns the length of a text by characters",
    func=get_text_length
)

def implement_set_api_key(api_key: str):
    """
    💡 **IMPLEMENTED**
    
    Set the OPENAI_API_KEY environment variable.
    
    Args:
        api_key (str): Your OpenAI API key
    """
    os.environ["OPENAI_API_KEY"] = api_key

def implement_create_model_with_tools(tools: List[Tool]) -> ChatOpenAI:
    """
    💡 **IMPLEMENTED**
    
    Create a ChatOpenAI model and bind the provided tools to it.
    This replaces the old ReAct prompt-based approach!
    
    Args:
        tools (List[Tool]): List of tools to bind to the model
        
    Returns:
        ChatOpenAI: Model with tools bound for tool calling
    """
    model = ChatOpenAI(temperature=0)
    return model.bind_tools(tools)

def implement_check_for_tool_calls(response: AIMessage) -> bool:
    """
    💡 **IMPLEMENTED**
    
    Check if the model response contains any tool calls.
    
    Args:
        response (AIMessage): The model's response
        
    Returns:
        bool: True if there are tool calls, False otherwise
    """
    return bool(response.tool_calls)

def implement_execute_tool_call(tool_call: Dict, available_tools: List[Tool]) -> str:
    """
    💡 **IMPLEMENTED**
    
    Execute a single tool call and return the result.
    
    Args:
        tool_call (Dict): Tool call information with 'name' and 'args'
        available_tools (List[Tool]): List of available tools
        
    Returns:
        str: The result of the tool execution
    """
    tool_name = tool_call['name']
    tool_args = tool_call['args']
    
    # Find the matching tool by name
    for tool in available_tools:
        if tool.name == tool_name:
            # For get_text_length, extract the 'text' field from args
            if tool_name == 'get_text_length' and isinstance(tool_args, dict):
                result = tool.invoke(tool_args['text'])
            else:
                result = tool.invoke(tool_args)
            return str(result)
    
    return f"Tool {tool_name} not found"

def implement_run_agent_with_tool_calling(model_with_tools: ChatOpenAI, 
                                        user_input: str, 
                                        available_tools: List[Tool]) -> str:
    """
    💡 **IMPLEMENTED**
    
    Run the modern tool calling agent. This replaces the old ReAct loop!
    
    Args:
        model_with_tools (ChatOpenAI): Model with tools bound
        user_input (str): The user's question
        available_tools (List[Tool]): Available tools for execution
        
    Returns:
        str: The final answer
        
    Algorithm:
    1. Send user_input to the model
    2. Check if response has tool calls
    3. If yes: execute the tool call and return the result directly
    4. If no tool calls: return the model's content as final answer
    """
    # Step 1: Send user input to the model
    response = model_with_tools.invoke(user_input)
    
    # Step 2: Check if response has tool calls
    if implement_check_for_tool_calls(response):
        # Step 3: Execute the first tool call and return result
        tool_call = response.tool_calls[0]
        result = implement_execute_tool_call(tool_call, available_tools)
        return result
    else:
        # Step 4: No tool calls, return model's content
        return response.content

# Test function (provided for students)
def check_api_key():
    """Check if OpenAI API key is set."""
    if "OPENAI_API_KEY" not in os.environ:
        raise Exception("❌ OPENAI_API_KEY environment variable is required!")
    print("✅ API key is set!")

print("🚀 Tool Calling Exercise - Implemented Solution")
print("=" * 50)
print("✅ All functions have been implemented!")
print("🎯 Modern tool calling replaces ReAct prompting")
print()

try:
    # Set up API key
    print("🔑 Setting up API key...")
    implement_set_api_key("demo_openai_key_12345")
    check_api_key()
    
    # Create model with tools
    print("🔧 Creating model with tool calling capabilities...")
    tools = [text_length_tool]
    model_with_tools = implement_create_model_with_tools(tools)
    
    # Test the agent
    print("🤖 Testing modern tool calling agent...")
    user_question = "What is the length of the word: DOG"
    result = implement_run_agent_with_tool_calling(model_with_tools, user_question, tools)
    
    print(f"📊 Final Result: {result}")
    print(f"\n✅ Expected: 3 (length of 'DOG')")
    print(f"✅ Got: {result}")
    
    if result == "3":
        print("\n🎉 SUCCESS! Tool calling agent works correctly!")
    else:
        print(f"\n⚠️ Unexpected result. Please verify implementation.")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
