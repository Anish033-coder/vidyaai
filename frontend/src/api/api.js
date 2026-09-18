const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5002";

function authHeaders() {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || "API request failed");
  }

  return data;
}

export async function getUserChats() {
  const res = await fetch(`${API}/api/chat/my`, {
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function createChat(courseId = null) {
  const res = await fetch(`${API}/api/chat/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ courseId }),
  });

  return handleResponse(res);
}

export async function getMessages(chatId) {
  const res = await fetch(`${API}/api/chat/${chatId}/messages`, {
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function sendMessage(chatId, message, mode="normal"){
  {
    const res = await fetch(`${API}/api/chat/message`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        chatId,
        message,
        mode
      })
    });

    return handleResponse(res);
  }
}
export async function getCourses(){
  {
    const res = await fetch(`${API}/api/courses`, {
      headers: authHeaders()
    });

    return handleResponse(res);
  }
}

export async function deleteChat(chatId){
  {
    const res = await fetch(`${API}/api/chat/${chatId}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    return handleResponse(res);
  }
}