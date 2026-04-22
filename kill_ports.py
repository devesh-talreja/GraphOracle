import psutil

def kill_port(port):
    for conn in psutil.net_connections():
        if conn.laddr.port == port:
            try:
                p = psutil.Process(conn.pid)
                p.kill()
                print(f"Killed process {conn.pid} on port {port}")
            except Exception as e:
                print(f"Failed to kill {conn.pid}: {e}")

kill_port(8000)
kill_port(5173)
