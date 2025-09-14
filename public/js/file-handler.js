class FileHandler {
  constructor() {
    this.fileInput = document.getElementById('file-input');
    this.codeInput = document.getElementById('code-input');

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.fileInput.addEventListener('change', (e) => {
      this.handleFileSelect(e);
    });
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.codeInput.value = e.target.result;
    };
    reader.readAsText(file);
  }

  loadExample() {
    this.codeInput.value = `// Example Scala code
object HelloWorld {
  def main(args: Array[String]): Unit = {
    val greeting = "Hello, World!"
    println(greeting)

    // Calculate factorial
    val number = 5
    val result = factorial(number)
    println(s"Factorial of $number is: $result")
  }

  def factorial(n: Int): Int = {
    if (n <= 1) 1
    else n * factorial(n - 1)
  }
}`;
  }

  clearCode() {
    this.codeInput.value = '';
  }
}
