from app.ingestion.parser import LogParser

def test_parse_ssh_failed_login():
    raw = "Aug 18 20:45:10 srv-01 sshd[1022]: Failed password for invalid user hacker from 192.168.1.55 port 42112 ssh2"
    parsed = LogParser.parse("linux-auth", raw, "srv-01")
    
    assert parsed["username"] == "hacker"
    assert parsed["source_ip"] == "192.168.1.55"
    assert parsed["event_type"] == "auth_failure"
    assert parsed["severity"] == "medium"

def test_parse_sudo_privilege_escalation():
    raw = "user1 : TTY=pts/0 ; PWD=/home/user1 ; USER=root ; COMMAND=/bin/bash"
    parsed = LogParser.parse("linux-auth", raw, "srv-01")
    
    assert parsed["username"] == "user1"
    assert parsed["event_type"] == "privilege_escalation"
    assert parsed["metadata"]["target_user"] == "root"

def test_parse_web_sqli_attack():
    raw = '10.0.0.99 - - [18/Aug/2026:20:45:10 +0000] "GET /products?id=1+UNION+SELECT+1,2,password+FROM+users HTTP/1.1" 403 150 "-" "curl/7.88.1"'
    parsed = LogParser.parse("nginx", raw, "web-01")
    
    assert parsed["source_ip"] == "10.0.0.99"
    assert parsed["event_type"] == "sql_injection_attempt"
    assert parsed["severity"] == "high"
